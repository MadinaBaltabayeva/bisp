import { z } from "zod";

export const disputeFormSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(500),
});

export type DisputeFormValues = z.infer<typeof disputeFormSchema>;
