import Link from "next/link";
import { MapPin, Star, Calendar, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    image: string | null;
    location: string;
    averageRating: number;
    reviewCount: number;
    createdAt: Date;
  };
  isOwnProfile: boolean;
}

function formatJoinDate(date: Date): string {
  return `Joined ${date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
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
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Pencil className="size-3.5" />
                  Edit Profile
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
                  ({user.reviewCount}{" "}
                  {user.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </div>

          {/* Join date */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>{formatJoinDate(user.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
