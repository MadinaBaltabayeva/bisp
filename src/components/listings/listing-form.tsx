"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  listingSchema,
  type ListingFormInput,
  type ListingFormValues,
} from "@/lib/validations/listing";
import {
  createListing,
  updateListing,
  deleteListing,
} from "@/features/listings/actions";

import { PhotoUploadGrid } from "./photo-upload-grid";
import { AISuggestions } from "./ai-suggestions";
import { AIDescriptionGenerator } from "./ai-description-generator";
import { PriceSuggestion } from "./price-suggestion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ExistingImage {
  id: string;
  url: string;
  isCover: boolean;
}

interface ExistingListing {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  priceHourly: number | null;
  priceDaily: number | null;
  priceWeekly: number | null;
  priceMonthly: number | null;
  location: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  tags: string;
  images: ExistingImage[];
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ListingFormProps {
  mode: "create" | "edit";
  listing?: ExistingListing;
  categories: CategoryOption[];
}

const CONDITION_KEYS = [
  { value: "new", labelKey: "new" },
  { value: "like_new", labelKey: "likeNew" },
  { value: "good", labelKey: "good" },
  { value: "fair", labelKey: "fair" },
  { value: "poor", labelKey: "poor" },
] as const;

const RATE_TYPES = [
  { key: "priceHourly" as const, labelKey: "rateHourly" },
  { key: "priceDaily" as const, labelKey: "rateDaily" },
  { key: "priceWeekly" as const, labelKey: "rateWeekly" },
  { key: "priceMonthly" as const, labelKey: "rateMonthly" },
] as const;

export function ListingForm({ mode, listing, categories }: ListingFormProps) {
  const t = useTranslations("Listings.form");
  const tc = useTranslations("Conditions");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    listing?.images ?? []
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string | null;
    tags: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Pricing rate type (single selection)
  const [selectedRate, setSelectedRate] = useState<string | null>(() => {
    if (listing?.priceHourly != null) return "priceHourly";
    if (listing?.priceDaily != null) return "priceDaily";
    if (listing?.priceWeekly != null) return "priceWeekly";
    if (listing?.priceMonthly != null) return "priceMonthly";
    return null;
  });

  // Tags state
  const [tags, setTags] = useState<string[]>(
    listing?.tags ? listing.tags.split(",").filter(Boolean) : []
  );

  const form = useForm<ListingFormInput, unknown, ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: listing?.title ?? "",
      description: listing?.description ?? "",
      categoryId: listing?.categoryId ?? "",
      condition: (listing?.condition as "new" | "like_new" | "good" | "fair" | "poor") ?? "good",
      priceHourly: listing?.priceHourly ?? undefined,
      priceDaily: listing?.priceDaily ?? undefined,
      priceWeekly: listing?.priceWeekly ?? undefined,
      priceMonthly: listing?.priceMonthly ?? undefined,
      location: listing?.location ?? "",
      region: listing?.region ?? "",
      latitude: listing?.latitude ?? undefined,
      longitude: listing?.longitude ?? undefined,
    },
  });

  const descValue = form.watch("description") || "";
  const watchedCategoryId = form.watch("categoryId");

  function handleAISuggest(suggestion: {
    category: string | null;
    tags: string[];
  }) {
    setAiSuggestion(suggestion);
    setAiLoading(false);

    if (suggestion.tags.length > 0) {
      setTags((prev) => {
        const combined = [...new Set([...prev, ...suggestion.tags])];
        return combined.slice(0, 10);
      });
    }
  }

  function handleCategorySelect(categorySlug: string) {
    const category = categories.find((c) => c.slug === categorySlug);
    if (category) {
      form.setValue("categoryId", category.id, { shouldValidate: true });
    }
  }

  function handleTagsChange(newTags: string[]) {
    if (aiSuggestion) {
      setAiSuggestion({ ...aiSuggestion, tags: newTags });
    }
    setTags(newTags);
  }

  function onSubmit(values: ListingFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("categoryId", values.categoryId);
      formData.append("condition", values.condition);

      if (values.priceHourly != null) formData.append("priceHourly", String(values.priceHourly));
      if (values.priceDaily != null) formData.append("priceDaily", String(values.priceDaily));
      if (values.priceWeekly != null) formData.append("priceWeekly", String(values.priceWeekly));
      if (values.priceMonthly != null) formData.append("priceMonthly", String(values.priceMonthly));

      formData.append("location", values.location);
      if (values.region) formData.append("region", values.region);
      if (values.latitude != null) formData.append("latitude", String(values.latitude));
      if (values.longitude != null) formData.append("longitude", String(values.longitude));

      if (tags.length > 0) formData.append("tags", tags.join(","));
      for (const photo of photos) formData.append("photos", photo);
      for (const id of deletedImageIds) formData.append("deleteImageIds", id);

      try {
        if (mode === "create") {
          const result = await createListing(formData);
          if ("error" in result) { toast.error(result.error); return; }
          toast.success(t("createSuccess"));
          router.push(`/listings/${result.listingId}`);
        } else if (listing) {
          const result = await updateListing(listing.id, formData);
          if ("error" in result) { toast.error(result.error); return; }
          toast.success(t("updateSuccess"));
          router.push(`/listings/${listing.id}`);
        }
      } catch {
        toast.error(t("genericError"));
      }
    });
  }

  async function handleDelete() {
    if (!listing) return;
    setIsDeleting(true);
    try {
      const result = await deleteListing(listing.id);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(t("deleteSuccess"));
      router.push("/");
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <PhotoUploadGrid
        photos={photos}
        existingImages={existingImages}
        onChange={setPhotos}
        onExistingImagesChange={setExistingImages}
        onDeletedImageIds={setDeletedImageIds}
        onAISuggest={(suggestion) => {
          setAiLoading(true);
          handleAISuggest(suggestion);
        }}
      />

      {/* AI Suggestions */}
      <AISuggestions
        suggestion={aiSuggestion}
        loading={aiLoading}
        onCategorySelect={handleCategorySelect}
        onTagsChange={handleTagsChange}
      />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>
              <AIDescriptionGenerator
                photos={photos}
                existingImages={existingImages}
                onGenerated={({ title, description }) => {
                  form.setValue("title", title, { shouldValidate: true });
                  form.setValue("description", description, { shouldValidate: true });
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription>{t("descriptionHint")}</FormDescription>
                    <span className={`text-xs ${descValue.length > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
                      {descValue.length}/2000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Category & Condition */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("categoryAndCondition")}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("categoryPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("condition")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("conditionPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITION_KEYS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {tc(c.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t("pricing")}</h3>
              <p className="text-sm text-muted-foreground">{t("pricingHint")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RATE_TYPES.map((rate) => (
                <button
                  key={rate.key}
                  type="button"
                  onClick={() => {
                    if (selectedRate === rate.key) {
                      setSelectedRate(null);
                      form.setValue(rate.key, undefined, { shouldValidate: true });
                    } else {
                      if (selectedRate) form.setValue(selectedRate as typeof rate.key, undefined);
                      setSelectedRate(rate.key);
                      form.clearErrors("priceDaily");
                    }
                  }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedRate === rate.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {t(rate.labelKey)}
                </button>
              ))}
            </div>

            {selectedRate && (
              <div className="max-w-xs">
                {RATE_TYPES.filter((rate) => rate.key === selectedRate).map((rate) => (
                  <FormField
                    key={rate.key}
                    control={form.control}
                    name={rate.key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("rateLabel", { rate: t(rate.labelKey) })}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-7"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              disabled={field.disabled}
                              value={field.value != null ? String(field.value) : ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            <PriceSuggestion
              categoryId={watchedCategoryId}
              listingId={listing?.id}
              onApply={(prices) => {
                form.setValue("priceHourly", prices.priceHourly, { shouldValidate: true });
                form.setValue("priceDaily", prices.priceDaily, { shouldValidate: true });
                form.setValue("priceWeekly", prices.priceWeekly, { shouldValidate: true });
                form.setValue("priceMonthly", prices.priceMonthly, { shouldValidate: true });
              }}
            />

            {form.formState.errors.priceDaily?.message === "At least one pricing rate is required" && (
              <p className="text-sm text-destructive">{t("pricingRequired")}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("location")}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locationPlaceholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("locationHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("regionOptional")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("regionPlaceholder")}
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormDescription>{t("regionHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <input type="hidden" {...form.register("latitude")} />
            <input type="hidden" {...form.register("longitude")} />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("tags")}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("tags")}{" "}
                <span className="font-normal text-muted-foreground">({t("tagsOptional")})</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((_, idx) => idx !== i))}
                      className="ml-0.5 rounded-full hover:bg-muted"
                    >
                      <span className="sr-only">{t("removeTag", { tag })}</span>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder={t("tagsPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim().replace(/,/g, "");
                    if (tag && tags.length < 10) {
                      setTags((prev) => [...prev, tag]);
                      input.value = "";
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">{t("tagsHint")}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t pt-6">
            <Button type="submit" disabled={isPending || isDeleting} size="lg">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "create" ? t("creating") : t("saving")}
                </>
              ) : mode === "create" ? (
                t("submit")
              ) : (
                t("save")
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(mode === "edit" && listing ? `/listings/${listing.id}` : "/")}
              disabled={isPending || isDeleting}
            >
              {tCommon("cancel")}
            </Button>

            {mode === "edit" && listing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="ml-auto" disabled={isPending || isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t("deleting")}
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteConfirmDescription", { title: listing.title })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {t("deleteConfirmAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
