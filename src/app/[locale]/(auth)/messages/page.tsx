import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSession } from "@/features/auth/queries";
import { getConversations } from "@/features/messages/queries";
import { MessagesLayout } from "./messages-layout";

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
    title: t("messages.title"),
    description: t("messages.description"),
  };
}

export default async function MessagesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Messages"),
  ]);

  if (!session) {
    redirect("/");
  }

  const conversations = await getConversations(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold">{t("title")}</h1>
      <MessagesLayout
        conversations={conversations}
        currentUserId={session.user.id}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          image: session.user.image ?? null,
        }}
      />
    </div>
  );
}
