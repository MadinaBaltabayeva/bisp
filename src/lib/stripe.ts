import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe: Stripe | null };

function createStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}

export function isStripeEnabled(): boolean {
  return stripe !== null;
}
