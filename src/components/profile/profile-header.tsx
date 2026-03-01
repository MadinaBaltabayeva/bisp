import { Link } from "@/i18n/navigation";
import { MapPin, Star, Calendar, Pencil } from "lucide-react";
import { getTranslations, getFormatter } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/profile/verification-badge";
import { ReputationBadges } from "@/components/profile/reputation-badge";
import type { UserBadge } from "@/features/badges/queries";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    image: string | null;
    location: string;
    averageRating: number;
    reviewCount: number;
    createdAt: Date;
    idVerified: boolean;
  };
  isOwnProfile: boolean;
  badges: UserBadge[];
}

export async function ProfileHeader({ user, isOwnProfile, badges }: ProfileHeaderProps) {
  const t = await getTranslations("Profile");
  const format = await getFormatter();

  const joinDate = format.dateTime(new Date(user.createdAt), {
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <Avatar className="size-24 text-2xl">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="bg-primary-100 text-primary-700 text-2xl">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.idVerified && <VerificationBadge />}
            {badges.length > 0 && <ReputationBadges badges={badges} />}
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Pencil className="size-3.5" />
                  {t("editProfile")}
                </Link>
              </Button>
            )}
          </div>

          {/* Location */}
          {user.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              <span>{user.location}</span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {user.reviewCount > 0 ? (
              <>
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-gray-900">
                  {user.averageRating.toFixed(1)}
                </span>
                <span>
                  ({t("reviewsCount", { count: user.reviewCount })})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("noReviews")}</span>
            )}
          </div>

          {/* Join date */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>{t("joined", { date: joinDate })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
