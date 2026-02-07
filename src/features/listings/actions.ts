"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { listingSchema } from "@/lib/validations/listing";
import { getSession } from "@/features/auth/queries";
import { moderateListing, suggestCategoryAndTags, translateAndIndexListing } from "./ai";
import { deleteFtsEntry } from "@/lib/search";
import { checkNotSuspended } from "@/features/admin/queries";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Create a new listing with photos.
 */
export async function createListing(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to create a listing." };
  }

  const suspended = await checkNotSuspended();
  if (suspended.error) return { error: suspended.error };

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    categoryId: formData.get("categoryId") as string,
    condition: formData.get("condition") as string,
    priceHourly: formData.get("priceHourly") || undefined,
    priceDaily: formData.get("priceDaily") || undefined,
    priceWeekly: formData.get("priceWeekly") || undefined,
    priceMonthly: formData.get("priceMonthly") || undefined,
    location: formData.get("location") as string,
    region: (formData.get("region") as string) || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };

  const result = listingSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid input." };
  }

  // Process photos
  const photos = formData.getAll("photos") as File[];
  const imageRecords: { url: string; isCover: boolean; sortOrder: number }[] =
    [];

  if (photos.length > 0) {
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "listings"
    );
    await mkdir(uploadDir, { recursive: true });

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      if (!(file instanceof File) || file.size === 0) continue;

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
          error:
            "Invalid file type. Please upload JPEG, PNG, or WebP images.",
        };
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return { error: "File too large. Maximum size is 5MB per image." };
      }

      const ext =
        file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
      const filename = `${randomUUID()}.${ext}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(join(uploadDir, filename), buffer);

      imageRecords.push({
        url: `/uploads/listings/${filename}`,
        isCover: i === 0,
        sortOrder: i,
      });
    }
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        categoryId: result.data.categoryId,
        condition: result.data.condition,
        priceHourly: result.data.priceHourly ?? null,
        priceDaily: result.data.priceDaily ?? null,
        priceWeekly: result.data.priceWeekly ?? null,
        priceMonthly: result.data.priceMonthly ?? null,
        location: result.data.location,
        region: result.data.region ?? "",
        latitude: result.data.latitude ?? null,
        longitude: result.data.longitude ?? null,
        ownerId: session.user.id,
        images: {
          create: imageRecords,
        },
      },
    });

    // Fire-and-forget AI moderation
    moderateListing(listing.id).catch(console.error);

    // Fire-and-forget FTS indexing with translation
    translateAndIndexListing(listing.id).catch(console.error);

    revalidatePath("/browse");
    revalidatePath("/");

    return { success: true, listingId: listing.id };
  } catch (error) {
    console.error("Failed to create listing:", error);
    return { error: "Failed to create listing. Please try again." };
  }
}

/**
 * Update an existing listing. Only the owner can update.
 */
export async function updateListing(listingId: string, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to update a listing." };
  }

  const suspended = await checkNotSuspended();
  if (suspended.error) return { error: suspended.error };

  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, title: true, description: true },
  });

  if (!existing) {
    return { error: "Listing not found." };
  }

  if (existing.ownerId !== session.user.id) {
    return { error: "You can only edit your own listings." };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    categoryId: formData.get("categoryId") as string,
    condition: formData.get("condition") as string,
    priceHourly: formData.get("priceHourly") || undefined,
    priceDaily: formData.get("priceDaily") || undefined,
    priceWeekly: formData.get("priceWeekly") || undefined,
    priceMonthly: formData.get("priceMonthly") || undefined,
    location: formData.get("location") as string,
    region: (formData.get("region") as string) || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };

  const result = listingSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid input." };
  }

  // Handle deleted images
  const deleteImageIds = formData.getAll("deleteImageIds") as string[];
  if (deleteImageIds.length > 0) {
    await prisma.listingImage.deleteMany({
      where: {
        id: { in: deleteImageIds },
        listingId: listingId,
      },
    });
  }

  // Handle new photos
  const photos = formData.getAll("photos") as File[];
  const newImageRecords: {
    url: string;
    isCover: boolean;
    sortOrder: number;
  }[] = [];

  if (photos.length > 0) {
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "listings"
    );
    await mkdir(uploadDir, { recursive: true });

    // Get current max sortOrder
    const lastImage = await prisma.listingImage.findFirst({
      where: { listingId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    let nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

    for (const file of photos) {
      if (!(file instanceof File) || file.size === 0) continue;

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
          error:
            "Invalid file type. Please upload JPEG, PNG, or WebP images.",
        };
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return { error: "File too large. Maximum size is 5MB per image." };
      }

      const ext =
        file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
      const filename = `${randomUUID()}.${ext}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(join(uploadDir, filename), buffer);

      newImageRecords.push({
        url: `/uploads/listings/${filename}`,
        isCover: false,
        sortOrder: nextSortOrder++,
      });
    }
  }

  try {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        title: result.data.title,
        description: result.data.description,
        categoryId: result.data.categoryId,
        condition: result.data.condition,
        priceHourly: result.data.priceHourly ?? null,
        priceDaily: result.data.priceDaily ?? null,
        priceWeekly: result.data.priceWeekly ?? null,
        priceMonthly: result.data.priceMonthly ?? null,
        location: result.data.location,
        region: result.data.region ?? "",
        latitude: result.data.latitude ?? null,
        longitude: result.data.longitude ?? null,
        images: {
          create: newImageRecords,
        },
      },
    });

    // Re-moderate if content changed
    const contentChanged =
      existing.title !== result.data.title ||
      existing.description !== result.data.description;
    if (contentChanged) {
      moderateListing(listingId).catch(console.error);
    }

    // Always re-index FTS (any field change could affect search)
    translateAndIndexListing(listingId).catch(console.error);

    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/browse");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to update listing:", error);
    return { error: "Failed to update listing. Please try again." };
  }
}

/**
 * Delete a listing. Only the owner can delete.
 */
export async function deleteListing(listingId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to delete a listing." };
  }

  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });

  if (!existing) {
    return { error: "Listing not found." };
  }

  if (existing.ownerId !== session.user.id) {
    return { error: "You can only delete your own listings." };
  }

  try {
    await prisma.listing.delete({
      where: { id: listingId },
    });

    // Fire-and-forget FTS cleanup
    deleteFtsEntry(listingId).catch(console.error);

    revalidatePath("/browse");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return { error: "Failed to delete listing. Please try again." };
  }
}

/**
 * Get AI-powered category and tag suggestions from a photo.
 */
export async function getAISuggestions(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const file = formData.get("photo") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No photo provided." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await suggestCategoryAndTags(dataUrl);
    return result ?? { category: null, tags: [] };
  } catch (error) {
    console.error("Failed to get AI suggestions:", error);
    return { error: "Failed to analyze photo." };
  }
}
