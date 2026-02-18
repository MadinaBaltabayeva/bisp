"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toggleFavorite } from "@/features/favorites/actions";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  isFavorited: boolean;
  isAuthenticated: boolean;
  className?: string;
}

export function FavoriteButton({
  listingId,
  isFavorited,
  isAuthenticated,
  className,
}: FavoriteButtonProps) {
  const t = useTranslations("Favorites");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorited, setOptimisticFavorited] =
    useOptimistic(isFavorited);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      setOptimisticFavorited(!optimisticFavorited);
      await toggleFavorite(listingId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={
        optimisticFavorited
          ? t("removeFromFavorites")
          : t("addToFavorites")
      }
      className={cn(
        "rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        optimisticFavorited
          ? "text-red-500"
          : "text-white/80 hover:text-white",
        className
      )}
    >
      <Heart
        className={cn(
          "size-5",
          optimisticFavorited && "fill-current"
        )}
      />
    </button>
  );
}
