import { getAdminUsers } from "@/features/admin/queries";
import { UserTable } from "@/components/admin/user-table";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const search = params.search || undefined;
  const status = params.status as "active" | "suspended" | undefined;

  const data = await getAdminUsers({ page, search, status });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          {data.total} user{data.total !== 1 ? "s" : ""} registered
        </p>
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
