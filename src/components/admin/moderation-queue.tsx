"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ShieldCheck } from "lucide-react";
import { ModerationCard } from "./moderation-card";

interface ModerationQueueProps {
  listings: Array<{
    id: string;
    title: string;
    status: string;
    moderationResult: string | null;
    createdAt: Date;
    owner: { name: string; email: string };
    images: Array<{ url: string; isCover: boolean }>;
    category: { name: string };
  }>;
}

export function ModerationQueue({ listings }: ModerationQueueProps) {
  const t = useTranslations("Admin.moderation");
  const router = useRouter();

  const handleAction = () => {
    router.refresh();
  };

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <ShieldCheck className="size-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">{t("allClear")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("noFlaggedListings")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <ModerationCard
          key={listing.id}
          listing={listing}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}
