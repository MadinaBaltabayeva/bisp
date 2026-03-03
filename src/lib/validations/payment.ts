import { z } from "zod";

export const paymentFormSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format: MM/YY"),
  cvc: z.string().regex(/^\d{3}$/, "CVC must be 3 digits"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
