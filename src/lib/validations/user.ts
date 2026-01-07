import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
    .optional()
    .default(""),
  location: z
    .string()
    .max(100, "Location must be at most 100 characters")
    .optional()
    .default(""),
});

export const onboardingSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location must be at most 100 characters"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
