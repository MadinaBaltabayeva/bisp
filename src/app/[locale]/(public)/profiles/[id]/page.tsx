import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getUserProfile, getSession } from "@/features/auth/queries";
import { getReviewsForUser } from "@/features/reviews/queries";
import { getUserListings } from "@/features/listings/queries";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSections } from "@/components/profile/profile-sections";

interface ProfilePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const [user, t] = await Promise.all([
    getUserProfile(id),
    getTranslations({ locale, namespace: "Metadata" }),
  ]);
  if (!user) {
    return { title: "User Not Found" };
  }
  return {
    title: t("profile.title", { name: user.name }),
    description: t("profile.description", { name: user.name }),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [user, session, reviews, listings] = await Promise.all([
    getUserProfile(id),
    getSession(),
    getReviewsForUser(id),
    getUserListings(id),
  ]);

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user.id === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
      <ProfileSections
        user={user}
        isOwnProfile={isOwnProfile}
        reviews={reviews}
        listings={listings}
      />
    </div>
  );
}
