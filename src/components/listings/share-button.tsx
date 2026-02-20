"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const t = useTranslations("Share");

  async function handleShare() {
    const shareData = { title, text, url };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      // AbortError means user cancelled the share dialog -- ignore silently
      if (err instanceof Error && err.name === "AbortError") return;
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="mr-1.5 size-4" />
      {t("share")}
    </Button>
  );
}
