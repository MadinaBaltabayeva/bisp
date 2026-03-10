"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AIDescriptionGeneratorProps {
  photos: File[];
  existingImages: { url: string }[];
  onGenerated: (result: { title: string; description: string }) => void;
}

export function AIDescriptionGenerator({
  photos,
  existingImages,
  onGenerated,
}: AIDescriptionGeneratorProps) {
  const t = useTranslations("Listings.aiGenerate");
  const [isGenerating, setIsGenerating] = useState(false);

  const hasImage = photos.length > 0 || existingImages.length > 0;

  function fileToDataURL(file: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      let imageBase64: string;

      if (photos.length > 0) {
        imageBase64 = await fileToDataURL(photos[0]);
      } else if (existingImages.length > 0) {
        const response = await fetch(existingImages[0].url);
        const blob = await response.blob();
        imageBase64 = await fileToDataURL(blob);
      } else {
        return;
      }

      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        throw new Error("Generation failed");
      }

      const result = await res.json();
      onGenerated(result);
      toast.success(t("success"));
    } catch {
      toast.error(t("error"));
    } finally {
      setIsGenerating(false);
    }
  }

  if (!hasImage) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {t("generating")}
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          {t("generate")}
        </>
      )}
    </Button>
  );
}
