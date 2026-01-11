import { notFound } from "next/navigation";
import { getUserProfile, getSession } from "@/features/auth/queries";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSections } from "@/components/profile/profile-sections";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { id } = await params;
  const user = await getUserProfile(id);
  if (!user) {
    return { title: "User Not Found - RentHub" };
  }
  return { title: `${user.name}'s Profile - RentHub` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const user = await getUserProfile(id);

  if (!user) {
    notFound();
  }

  const session = await getSession();
  const isOwnProfile = session?.user.id === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
      <ProfileSections user={user} isOwnProfile={isOwnProfile} />
    </div>
  );
}
