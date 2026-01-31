"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { format } from "date-fns";
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
              ? `${userName} has been unsuspended`
              : `${userName} has been suspended`
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
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found.
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
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700 bg-green-50"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
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
                            user.isSuspended ? "Unsuspend" : "Suspend"
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
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, initialTotal)} of {initialTotal}{" "}
            users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
