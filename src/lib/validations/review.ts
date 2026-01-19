import { z } from "zod";

export const reviewSchema = z.object({
  rentalId: z.string().min(1, "Rental is required"),
  revieweeId: z.string().min(1, "Reviewee is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating required")
    .max(5, "Maximum 5 stars"),
  comment: z
    .string()
    .max(1000, "Review must be at most 1000 characters")
    .optional(),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
