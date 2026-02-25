import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCurrentUserProfile } from "@/features/auth/queries";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { VerificationSection } from "@/components/profile/verification-section";
import { EmailToggle } from "@/components/notifications/email-toggle";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("settings.title"),
    description: t("settings.description"),
  };
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [user, t] = await Promise.all([
    getCurrentUserProfile(),
    getTranslations("Settings"),
  ]);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <ProfileEditForm user={user} />

      <div className="mt-10 border-t pt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("identityVerification")}
        </h2>
        <VerificationSection isVerified={user.idVerified} />
      </div>

      <div className="mt-10 border-t pt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("emailNotifications")}
        </h2>
        <EmailToggle defaultEnabled={user.emailNotifications} />
      </div>
    </div>
  );
}
