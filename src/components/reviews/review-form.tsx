"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { reviewSchema, type ReviewInput } from "@/lib/validations/review";
import { createReview } from "@/features/reviews/actions";
import { StarRating } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewFormProps {
  rentalId: string;
  revieweeId: string;
  revieweeName: string;
}

export function ReviewForm({
  rentalId,
  revieweeId,
  revieweeName,
}: ReviewFormProps) {
  const t = useTranslations("Reviews");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rentalId,
      revieweeId,
      rating: 0,
      comment: "",
    },
  });

  const ratingValue = form.watch("rating");

  function onSubmit(values: ReviewInput) {
    startTransition(async () => {
      const result = await createReview(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("submitSuccess"));
        setOpen(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Star className="size-3.5" />
          {t("leaveReview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reviewTitle", { name: revieweeName })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("rating")}</Label>
            <StarRating
              value={ratingValue}
              onChange={(val) => form.setValue("rating", val, { shouldValidate: true })}
              size="lg"
            />
            {form.formState.errors.rating && (
              <p className="text-xs text-red-500">
                {form.formState.errors.rating.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{t("commentOptional")}</Label>
            <Textarea
              id="comment"
              placeholder={t("commentPlaceholder")}
              {...form.register("comment")}
              maxLength={1000}
              rows={4}
            />
            {form.formState.errors.comment && (
              <p className="text-xs text-red-500">
                {form.formState.errors.comment.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
