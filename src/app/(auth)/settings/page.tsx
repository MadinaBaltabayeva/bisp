import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/features/auth/queries";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const metadata = {
  title: "Settings - RentHub",
};

export default async function SettingsPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile information visible to other users.
        </p>
      </div>
      <ProfileEditForm user={user} />
    </div>
  );
}
