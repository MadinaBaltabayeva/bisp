import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";
import { getListingById } from "@/features/listings/queries";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata = {
  title: "Edit Listing - RentHub",
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const listing = await getListingById(id);
  if (!listing) {
    notFound();
  }

  // Verify ownership
  if (listing.ownerId !== session.user.id) {
    redirect(`/listings/${id}`);
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const listingData = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    categoryId: listing.categoryId,
    condition: listing.condition,
    priceHourly: listing.priceHourly,
    priceDaily: listing.priceDaily,
    priceWeekly: listing.priceWeekly,
    priceMonthly: listing.priceMonthly,
    location: listing.location,
    region: listing.region,
    latitude: listing.latitude,
    longitude: listing.longitude,
    tags: listing.tags,
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url,
      isCover: img.isCover,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your listing details and photos.
        </p>
      </div>
      <ListingForm
        mode="edit"
        listing={listingData}
        categories={categories}
      />
    </div>
  );
}
