import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Heart } from "lucide-react";

interface TopListingsProps {
  listings: {
    id: string;
    title: string;
    coverImage: string | null;
    rentalCount: number;
    favoriteCount: number;
  }[];
  translations: {
    title: string;
    rentals: string;
    favorites: string;
    noListings: string;
  };
}

export function TopListings({ listings, translations }: TopListingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5" />
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{translations.noListings}</p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing, i) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                {listing.coverImage ? (
                  <Image
                    src={listing.coverImage}
                    alt={listing.title}
                    width={40}
                    height={40}
                    className="size-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{listing.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{listing.rentalCount} {translations.rentals}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {listing.favoriteCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
