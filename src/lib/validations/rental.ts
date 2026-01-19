import { z } from "zod";

export const rentalRequestSchema = z
  .object({
    listingId: z.string().min(1, "Listing is required"),
    startDate: z.coerce
      .date()
      .refine(
        (d) => d >= new Date(new Date().setHours(0, 0, 0, 0)),
        "Start date must be today or later"
      ),
    endDate: z.coerce.date(),
    message: z
      .string()
      .max(500, "Message must be at most 500 characters")
      .optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type RentalRequestInput = z.input<typeof rentalRequestSchema>;
export type RentalRequestValues = z.infer<typeof rentalRequestSchema>;
