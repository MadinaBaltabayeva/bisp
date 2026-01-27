"use client";

import { useState, useTransition } from "react";
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
        toast.error("Failed to load deletion counts");
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
        toast.success(`${userName} has been deleted`);
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
          <AlertDialogTitle>Delete {userName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user
            account and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : counts ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive mb-2">
              This will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{counts.listings} listing{counts.listings !== 1 ? "s" : ""}</li>
              <li>{counts.rentals} rental{counts.rentals !== 1 ? "s" : ""}</li>
              <li>{counts.messages} message{counts.messages !== 1 ? "s" : ""}</li>
              <li>{counts.reviews} review{counts.reviews !== 1 ? "s" : ""}</li>
            </ul>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || loading}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
