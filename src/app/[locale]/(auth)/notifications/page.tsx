import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSession } from "@/features/auth/queries";
import { getNotifications } from "@/features/notifications/queries";
import { NotificationPageContent } from "@/components/notifications/notification-page-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Notifications" });
  return {
    title: t("title"),
  };
}

export default async function NotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const notifications = await getNotifications(session.user.id);

  return <NotificationPageContent notifications={notifications} />;
}
