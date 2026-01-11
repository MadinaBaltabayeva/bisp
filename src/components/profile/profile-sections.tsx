import { Package, Star, UserCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProfileSectionsProps {
  user: {
    bio: string;
  };
  isOwnProfile: boolean;
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <Separator />
    </div>
  );
}

export function ProfileSections({ user, isOwnProfile }: ProfileSectionsProps) {
  return (
    <div className="space-y-8">
      {/* Listings Section */}
      <section>
        <SectionHeading icon={Package} title="Listings" />
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <Package className="mx-auto size-10 text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-500">
            No listings yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Listings coming in a future update
          </p>
        </div>
      </section>

      {/* Reviews Section */}
      <section>
        <SectionHeading icon={Star} title="Reviews" />
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <Star className="mx-auto size-10 text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-500">
            No reviews yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Reviews will appear here after completed rentals
          </p>
        </div>
      </section>

      {/* About Section */}
      <section>
        <SectionHeading icon={UserCircle} title="About" />
        <div className="mt-4">
          {user.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {user.bio}
            </p>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <UserCircle className="mx-auto size-10 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-500">
                {isOwnProfile
                  ? "You haven't written a bio yet"
                  : "This user hasn't written a bio yet"}
              </p>
              {isOwnProfile && (
                <p className="mt-1 text-xs text-gray-400">
                  Add a bio from your profile settings
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
