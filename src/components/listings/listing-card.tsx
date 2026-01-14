import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    priceDaily: number | null;
    priceHourly: number | null;
    priceWeekly: number | null;
    priceMonthly: number | null;
    location: string;
    aiVerified: boolean;
    images: Array<{ id: string; url: string; isCover: boolean }>;
    category: { id: string; name: string; slug: string };
  };
}

function formatPrice(listing: ListingCardProps["listing"]): string {
  if (listing.priceDaily != null) {
    return `$${listing.priceDaily}/day`;
  }
  if (listing.priceHourly != null) {
    return `$${listing.priceHourly}/hr`;
  }
  if (listing.priceWeekly != null) {
    return `$${listing.priceWeekly}/wk`;
  }
  if (listing.priceMonthly != null) {
    return `$${listing.priceMonthly}/mo`;
  }
  return "Contact for price";
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0];
  const priceLabel = formatPrice(listing);

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="overflow-hidden rounded-lg">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No photo
            </div>
          )}
          {listing.aiVerified && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <ShieldCheck className="size-3" />
              AI Verified
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="truncate font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {listing.title}
        </h3>
        <p className="text-sm text-muted-foreground">{listing.category.name}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        <p className="font-semibold text-primary-600">
          From {priceLabel}
        </p>
      </div>
    </Link>
  );
}
