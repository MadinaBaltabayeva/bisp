"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function ListingForm({ mode, listing, categories }: ListingFormProps) {
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

  function handleAISuggest(suggestion: {
    category: string | null;
    tags: string[];
  }) {
    setAiSuggestion(suggestion);
    setAiLoading(false);

    // Auto-apply tags from AI suggestion
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

      if (values.priceHourly != null) {
        formData.append("priceHourly", String(values.priceHourly));
      }
      if (values.priceDaily != null) {
        formData.append("priceDaily", String(values.priceDaily));
      }
      if (values.priceWeekly != null) {
        formData.append("priceWeekly", String(values.priceWeekly));
      }
      if (values.priceMonthly != null) {
        formData.append("priceMonthly", String(values.priceMonthly));
      }

      formData.append("location", values.location);
      if (values.region) formData.append("region", values.region);
      if (values.latitude != null)
        formData.append("latitude", String(values.latitude));
      if (values.longitude != null)
        formData.append("longitude", String(values.longitude));

      // Append tags as comma-separated string
      if (tags.length > 0) {
        formData.append("tags", tags.join(","));
      }

      // Append photos
      for (const photo of photos) {
        formData.append("photos", photo);
      }

      // Append deleted image IDs (for edit mode)
      for (const id of deletedImageIds) {
        formData.append("deleteImageIds", id);
      }

      try {
        if (mode === "create") {
          const result = await createListing(formData);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success("Listing created successfully!");
          router.push(`/listings/${result.listingId}`);
        } else if (listing) {
          const result = await updateListing(listing.id, formData);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success("Listing updated successfully!");
          router.push(`/listings/${listing.id}`);
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  async function handleDelete() {
    if (!listing) return;
    setIsDeleting(true);
    try {
      const result = await deleteListing(listing.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Listing deleted successfully!");
      router.push("/");
    } catch {
      toast.error("Failed to delete listing.");
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
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. DeWalt 20V Power Drill"
                      {...field}
                    />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your item, its condition, what's included..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription>
                      Include details about condition, accessories, and usage
                      instructions.
                    </FormDescription>
                    <span
                      className={`text-xs ${
                        descValue.length > 2000
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
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
            <h3 className="text-lg font-semibold">Category & Condition</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
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
                    <FormLabel>Condition</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
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
              <h3 className="text-lg font-semibold">Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Set the rates that apply (at least one required)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceHourly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.value
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceDaily"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.value
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceWeekly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.value
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.value
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Show pricing refinement error */}
            {form.formState.errors.priceDaily?.message ===
              "At least one pricing rate is required" && (
              <p className="text-sm text-destructive">
                At least one pricing rate is required
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. San Francisco, CA"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where the item is available for pickup.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Bay Area, California"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Broader area to help with search.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hidden lat/lng fields for future map picker */}
            <input type="hidden" {...form.register("latitude")} />
            <input type="hidden" {...form.register("longitude")} />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tags</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tags{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
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
                      onClick={() =>
                        setTags((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="ml-0.5 rounded-full hover:bg-muted"
                    >
                      <span className="sr-only">Remove {tag}</span>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="Type a tag and press Enter or comma to add"
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
              <p className="text-xs text-muted-foreground">
                Add up to 10 tags to help others find your listing.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t pt-6">
            <Button type="submit" disabled={isPending || isDeleting} size="lg">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Listing"
              ) : (
                "Save Changes"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  mode === "edit" && listing
                    ? `/listings/${listing.id}`
                    : "/"
                )
              }
              disabled={isPending || isDeleting}
            >
              Cancel
            </Button>

            {mode === "edit" && listing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="ml-auto"
                    disabled={isPending || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4" />
                        Delete Listing
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your listing &quot;
                      {listing.title}&quot; will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Yes, delete listing
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
