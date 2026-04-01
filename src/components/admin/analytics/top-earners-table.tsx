import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star } from "lucide-react";

interface TopEarnersTableProps {
  data: {
    id: string;
    name: string;
    image: string | null;
    averageRating: number;
    revenue: number;
    rentalCount: number;
  }[];
}

export function TopEarnersTable({ data }: TopEarnersTableProps) {
  const t = useTranslations("Admin.analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5" />
          {t("topEarners")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>{t("user")}</TableHead>
                <TableHead className="text-right">{t("revenue")}</TableHead>
                <TableHead className="text-right">{t("rentals")}</TableHead>
                <TableHead className="text-right">{t("rating")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((earner, i) => (
                <TableRow key={earner.id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={earner.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {earner.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{earner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${earner.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{earner.rentalCount}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {earner.averageRating.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
