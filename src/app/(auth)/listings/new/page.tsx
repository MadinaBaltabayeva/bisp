import { prisma } from "@/lib/db";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata = {
  title: "List an Item - RentHub",
};

export default async function CreateListingPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">List an Item</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your item with the community. Start by uploading photos.
        </p>
      </div>
      <ListingForm mode="create" categories={categories} />
    </div>
  );
}
