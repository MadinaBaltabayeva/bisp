"use client";

import { useRef, useState, useCallback } from "react";
import { Plus, X, Loader2, ImageIcon } from "lucide-react";
import { getAISuggestions } from "@/features/listings/actions";

interface ExistingImage {
  id: string;
  url: string;
  isCover: boolean;
}

interface PhotoUploadGridProps {
  photos: File[];
  existingImages?: ExistingImage[];
  onChange: (photos: File[]) => void;
  onExistingImagesChange?: (images: ExistingImage[]) => void;
  onDeletedImageIds?: (ids: string[]) => void;
  onAISuggest?: (suggestion: {
    category: string | null;
    tags: string[];
  }) => void;
}

const MAX_SLOTS = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 0.8;

/**
 * Resize an image file using Canvas API.
 * Returns a new File resized to max 1920px width at 80% JPEG quality.
 */
async function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resized = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export function PhotoUploadGrid({
  photos,
  existingImages = [],
  onChange,
  onExistingImagesChange,
  onDeletedImageIds,
  onAISuggest,
}: PhotoUploadGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(new Map());
  const hasFetchedAI = useRef(false);

  const totalImages = existingImages.length + photos.length;
  const emptySlots = Math.max(0, MAX_SLOTS - totalImages);

  const getPreviewUrl = useCallback(
    (file: File) => {
      if (previewUrls.has(file)) {
        return previewUrls.get(file)!;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => new Map(prev).set(file, url));
      return url;
    },
    [previewUrls]
  );

  function handleSlotClick(slotIndex: number) {
    // If we have a selected index and this slot is different, swap
    if (selectedIndex !== null && selectedIndex !== slotIndex) {
      const allItems = [
        ...existingImages.map((img) => ({ type: "existing" as const, img })),
        ...photos.map((photo) => ({ type: "new" as const, photo })),
      ];

      if (slotIndex < allItems.length && selectedIndex < allItems.length) {
        // Swap the two items
        const temp = allItems[selectedIndex];
        allItems[selectedIndex] = allItems[slotIndex];
        allItems[slotIndex] = temp;

        const newExisting = allItems
          .filter((item) => item.type === "existing")
          .map((item) => (item as { type: "existing"; img: ExistingImage }).img);
        const newPhotos = allItems
          .filter((item) => item.type === "new")
          .map((item) => (item as { type: "new"; photo: File }).photo);

        // For simplicity, reorder within their respective arrays
        if (onExistingImagesChange) onExistingImagesChange(newExisting);
        onChange(newPhotos);
      }
      setSelectedIndex(null);
      return;
    }

    // If clicking an empty slot, open file input
    if (slotIndex >= totalImages) {
      fileInputRef.current?.click();
      setSelectedIndex(null);
      return;
    }

    // Select this slot for reordering
    setSelectedIndex(slotIndex);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size > 0
    );

    const remaining = MAX_SLOTS - totalImages;
    const toAdd = validFiles.slice(0, remaining);

    // Resize each file
    const resized: File[] = [];
    for (const file of toAdd) {
      try {
        const r = await resizeImage(file);
        resized.push(r);
      } catch {
        resized.push(file);
      }
    }

    const newPhotos = [...photos, ...resized];
    onChange(newPhotos);

    // Trigger AI suggestions on first photo upload
    if (!hasFetchedAI.current && onAISuggest && resized.length > 0) {
      hasFetchedAI.current = true;
      setAiLoading(true);
      try {
        const formData = new FormData();
        formData.append("photo", resized[0]);
        const result = await getAISuggestions(formData);
        if (result && !("error" in result)) {
          onAISuggest(result);
        }
      } catch {
        // AI suggestions are non-critical
      } finally {
        setAiLoading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeExistingImage(index: number) {
    const image = existingImages[index];
    const newDeletedIds = [...deletedIds, image.id];
    setDeletedIds(newDeletedIds);
    onDeletedImageIds?.(newDeletedIds);

    const newImages = existingImages.filter((_, i) => i !== index);
    onExistingImagesChange?.(newImages);
    setSelectedIndex(null);
  }

  function removeNewPhoto(photoIndex: number) {
    const file = photos[photoIndex];
    const url = previewUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      setPreviewUrls((prev) => {
        const next = new Map(prev);
        next.delete(file);
        return next;
      });
    }
    const newPhotos = photos.filter((_, i) => i !== photoIndex);
    onChange(newPhotos);
    setSelectedIndex(null);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Photos{" "}
        <span className="text-muted-foreground font-normal">
          ({totalImages}/{MAX_SLOTS})
        </span>
      </label>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {/* Existing images */}
        {existingImages.map((image, index) => (
          <div
            key={`existing-${image.id}`}
            onClick={() => handleSlotClick(index)}
            className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${
              index === 0 && existingImages.length > 0
                ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2"
                : ""
            } ${
              selectedIndex === index
                ? "border-primary ring-2 ring-primary/30"
                : "border-muted"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`Photo ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeExistingImage(index);
              }}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {/* New photos */}
        {photos.map((file, photoIndex) => {
          const globalIndex = existingImages.length + photoIndex;
          const isCoverSlot =
            globalIndex === 0 && existingImages.length === 0;
          return (
            <div
              key={`new-${photoIndex}-${file.name}`}
              onClick={() => handleSlotClick(globalIndex)}
              className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${
                isCoverSlot
                  ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2"
                  : ""
              } ${
                selectedIndex === globalIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-muted"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPreviewUrl(file)}
                alt={`Photo ${globalIndex + 1}`}
                className="h-full w-full object-cover"
              />
              {isCoverSlot && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
              {isCoverSlot && aiLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNewPhoto(photoIndex);
                }}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => {
          const slotIndex = totalImages + i;
          const isCoverSlot = slotIndex === 0;
          return (
            <div
              key={`empty-${i}`}
              onClick={() => handleSlotClick(slotIndex)}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50 hover:bg-muted/50 ${
                isCoverSlot
                  ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2"
                  : ""
              }`}
            >
              {isCoverSlot ? (
                <>
                  <ImageIcon className="size-8 text-muted-foreground/50" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Cover Photo
                  </span>
                </>
              ) : (
                <Plus className="size-5 text-muted-foreground/50" />
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground">
        Click a slot to add photos. Click two photos to swap their positions.
        First photo becomes the cover image.
      </p>
    </div>
  );
}
