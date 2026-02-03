"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Ban, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { suspendUser, unsuspendUser } from "@/features/admin/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteUserDialog } from "./delete-user-dialog";

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isSuspended: boolean;
  idVerified: boolean;
  createdAt: Date;
  _count: { listings: number };
}

interface UserTableProps {
  initialUsers: UserData[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}

export function UserTable({
  initialUsers,
  initialTotal,
  initialPage,
  pageSize,
}: UserTableProps) {
  const t = useTranslations("Admin.users");
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [isPending, startTransition] = useTransition();

  const currentPage = initialPage;
  const totalPages = Math.ceil(initialTotal / pageSize);
  const currentStatus = searchParams.get("status") || "all";

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/admin/users?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSuspendToggle = useCallback(
    (userId: string, isSuspended: boolean, userName: string) => {
      startTransition(async () => {
        const result = isSuspended
          ? await unsuspendUser(userId)
          : await suspendUser(userId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            isSuspended
              ? t("unsuspended", { name: userName })
              : t("suspendedToast", { name: userName })
          );
          router.refresh();
        }
      });
    },
    [router]
  );

  const handleDeleted = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="suspended">{t("suspended")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("joined")}</TableHead>
              <TableHead>{t("listings")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={user.image || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isSuspended ? (
                      <Badge variant="destructive">{t("suspended")}</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700 bg-green-50"
                      >
                        {t("active")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format.dateTime(new Date(user.createdAt), { year: "numeric", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell>{user._count.listings}</TableCell>
                  <TableCell>
                    {user.role !== "admin" && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleSuspendToggle(
                              user.id,
                              user.isSuspended,
                              user.name
                            )
                          }
                          disabled={isPending}
                          title={
                            user.isSuspended ? t("unsuspend") : t("suspend")
                          }
                        >
                          {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : user.isSuspended ? (
                            <CheckCircle className="size-4 text-green-600" />
                          ) : (
                            <Ban className="size-4 text-orange-600" />
                          )}
                        </Button>
                        <DeleteUserDialog
                          userId={user.id}
                          userName={user.name}
                          onDeleted={handleDeleted}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showingRange", { from: (currentPage - 1) * pageSize + 1, to: Math.min(currentPage * pageSize, initialTotal), total: initialTotal })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
              {t("previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("page", { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {t("next")}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
