import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";

import { getSession } from "@/features/auth/queries";
import {
  getRentalWithEvents,
  getPaymentForRental,
} from "@/features/rentals/queries";
import { CheckoutForm } from "@/components/rentals/checkout-form";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Checkout"),
  ]);

  if (!session) return null;

  const rental = await getRentalWithEvents(id);
  if (!rental) {
    notFound();
  }

  // Only the renter can access the checkout page
  if (session.user.id !== rental.renterId) {
    redirect({ href: `/rentals/${id}`, locale });
    return null;
  }

  // Only approved rentals can be paid
  if (rental.status !== "approved") {
    redirect({ href: `/rentals/${id}`, locale });
    return null;
  }

  // Prevent double payment
  const existingPayment = await getPaymentForRental(id);
  if (existingPayment) {
    redirect({ href: `/rentals/${id}`, locale });
    return null;
  }

  // Calculate pricing
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyRate =
    rental.listing.priceDaily ?? (days > 0 ? rental.totalPrice / days : 0);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CheckoutForm
        rentalId={id}
        totalPrice={rental.totalPrice}
        securityDeposit={rental.securityDeposit}
        dailyRate={dailyRate}
        days={days}
      />
    </div>
  );
}
