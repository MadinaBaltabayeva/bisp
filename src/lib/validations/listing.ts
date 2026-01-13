import { z } from "zod";

const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;
const SORT_OPTIONS = ["relevance", "price_asc", "price_desc", "date"] as const;

export const listingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be at most 2000 characters"),
    categoryId: z.string().min(1, "Category is required"),
    condition: z.enum(CONDITIONS).default("good"),
    priceHourly: z.coerce.number().positive("Must be positive").optional(),
    priceDaily: z.coerce.number().positive("Must be positive").optional(),
    priceWeekly: z.coerce.number().positive("Must be positive").optional(),
    priceMonthly: z.coerce.number().positive("Must be positive").optional(),
    location: z.string().min(1, "Location is required"),
    region: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
  })
  .refine(
    (data) =>
      data.priceHourly != null ||
      data.priceDaily != null ||
      data.priceWeekly != null ||
      data.priceMonthly != null,
    {
      message: "At least one pricing rate is required",
      path: ["priceDaily"],
    }
  );

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(SORT_OPTIONS).default("date"),
  region: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
});

export type ListingFormValues = z.infer<typeof listingSchema>;
export type ListingFormInput = z.input<typeof listingSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
