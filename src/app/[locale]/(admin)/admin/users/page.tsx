import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAdminUsers } from "@/features/admin/queries";
import { UserTable } from "@/components/admin/user-table";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("adminUsers.title"),
    description: t("adminUsers.description"),
  };
}

export default async function AdminUsersPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const search = sp.search || undefined;
  const status = sp.status as "active" | "suspended" | undefined;

  const [data, t] = await Promise.all([
    getAdminUsers({ page, search, status }),
    getTranslations("Admin.users"),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {/* User Table */}
      <UserTable
        initialUsers={data.users}
        initialTotal={data.total}
        initialPage={data.page}
        pageSize={data.pageSize}
      />
    </div>
  );
}
