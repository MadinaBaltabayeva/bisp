"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useFormatter } from "next-intl";
import { StarRating } from "@/components/reviews/star-rating";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    reviewer: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations("Profile");
  const format = useFormatter();

  const dateStr = format.dateTime(new Date(review.createdAt), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex gap-3 py-4">
      {/* Reviewer avatar */}
      <Link
        href={`/profiles/${review.reviewer.id}`}
        className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted"
      >
        {review.reviewer.image ? (
          <Image
            src={review.reviewer.image}
            alt={review.reviewer.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
            {review.reviewer.name.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      {/* Review content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/profiles/${review.reviewer.id}`}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {review.reviewer.name}
          </Link>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        <div className="mt-1">
          <StarRating value={review.rating} readonly size="sm" />
        </div>
        {review.comment ? (
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            {review.comment}
          </p>
        ) : (
          <p className="mt-1.5 text-sm italic text-muted-foreground">
            {t("noComment")}
          </p>
        )}
      </div>
    </div>
  );
}
