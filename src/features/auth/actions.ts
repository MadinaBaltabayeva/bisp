"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validations/user";
import { getSession } from "./queries";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Update the current user's profile (name, bio, location).
 */
export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to update your profile." };
  }

  const raw = {
    name: formData.get("name") as string,
    bio: formData.get("bio") as string,
    location: formData.get("location") as string,
  };

  const result = profileSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid input." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: result.data.name,
        bio: result.data.bio ?? "",
        location: result.data.location ?? "",
      },
    });

    revalidatePath(`/profiles/${session.user.id}`);
    revalidatePath("/settings");

    return { success: true };
  } catch {
    return { error: "Failed to update profile. Please try again." };
  }
}

/**
 * Update the current user's profile photo.
 * Accepts a FormData with a "file" field containing an image.
 */
export async function updateProfilePhoto(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to update your photo." };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "File too large. Maximum size is 5MB." };
  }

  try {
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    revalidatePath(`/profiles/${session.user.id}`);
    revalidatePath("/settings");

    return { success: true, imageUrl };
  } catch {
    return { error: "Failed to upload photo. Please try again." };
  }
}
