import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, Search, Heart, MousePointerClick } from "lucide-react";

interface ListingAnalytics {
  id: string;
  title: string;
  status: string;
  coverImage: string | null;
  views: number;
  impressions: number;
  ctr: number;
  favorites: number;
  rentals: number;
  inquiries: number;
  inquiryRate: number;
}

interface ListingAnalyticsTableProps {
  data: ListingAnalytics[];
  translations: {
    title: string;
    listing: string;
    views: string;
    appearances: string;
    ctr: string;
    favorites: string;
    rentals: string;
    inquiries: string;
    noListings: string;
  };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  draft: "secondary",
  hidden: "outline",
  under_review: "secondary",
  rejected: "destructive",
  unavailable: "outline",
};

export function ListingAnalyticsTable({ data, translations }: ListingAnalyticsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{translations.noListings}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.listing}</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1"><Eye className="size-3" />{translations.views}</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1"><Search className="size-3" />{translations.appearances}</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />{translations.ctr}</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1"><Heart className="size-3" />{translations.favorites}</span>
                  </TableHead>
                  <TableHead className="text-right">{translations.rentals}</TableHead>
                  <TableHead className="text-right">{translations.inquiries}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
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
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium max-w-[200px]">{listing.title}</p>
                          <Badge variant={STATUS_VARIANT[listing.status] || "outline"} className="text-xs mt-0.5">
                            {listing.status}
                          </Badge>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">{listing.views}</TableCell>
                    <TableCell className="text-right">{listing.impressions}</TableCell>
                    <TableCell className="text-right">{listing.ctr}%</TableCell>
                    <TableCell className="text-right">{listing.favorites}</TableCell>
                    <TableCell className="text-right">{listing.rentals}</TableCell>
                    <TableCell className="text-right">{listing.inquiries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
