"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteUser,
  getUserDeletionCounts,
} from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  onDeleted: () => void;
}

export function DeleteUserDialog({
  userId,
  userName,
  onDeleted,
}: DeleteUserDialogProps) {
  const t = useTranslations("Admin.users");
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<{
    listings: number;
    rentals: number;
    messages: number;
    reviews: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      try {
        const result = await getUserDeletionCounts(userId);
        if ("error" in result) {
          toast.error(result.error as string);
          setOpen(false);
          return;
        }
        setCounts(result as { listings: number; rentals: number; messages: number; reviews: number });
      } catch {
        toast.error(t("deletionCountsError"));
        setOpen(false);
      } finally {
        setLoading(false);
      }
    } else {
      setCounts(null);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("deletedToast", { name: userName }));
        setOpen(false);
        onDeleted();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name: userName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : counts ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive mb-2">
              {t("willDelete")}
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("listingsCount", { count: counts.listings })}</li>
              <li>{t("rentalsCount", { count: counts.rentals })}</li>
              <li>{t("messagesCount", { count: counts.messages })}</li>
              <li>{t("reviewsCount", { count: counts.reviews })}</li>
            </ul>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || loading}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("deleteUser")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
