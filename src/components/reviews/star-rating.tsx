"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
};

interface StarRatingInteractiveProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: false;
}

interface StarRatingDisplayProps {
  value: number;
  readonly: true;
  size?: "sm" | "md" | "lg";
  onChange?: never;
}

type StarRatingProps = StarRatingInteractiveProps | StarRatingDisplayProps;

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const sizeClass = SIZE_MAP[size];

  if (readonly) {
    // Display-only mode with half-star support
    const rounded = Math.round(value * 2) / 2;

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= rounded;
          const isHalf = !isFull && star - 0.5 <= rounded;

          return (
            <span key={star} className="relative">
              {isHalf ? (
                <>
                  {/* Empty star background */}
                  <Star className={cn(sizeClass, "text-gray-300")} />
                  {/* Half-filled overlay */}
                  <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                    <Star className={cn(sizeClass, "fill-yellow-400 text-yellow-400")} />
                  </span>
                </>
              ) : (
                <Star
                  className={cn(
                    sizeClass,
                    isFull
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // Interactive mode
  const displayValue = hoverValue || value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              star <= displayValue
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
