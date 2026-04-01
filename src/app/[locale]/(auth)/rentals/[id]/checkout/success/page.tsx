import { CheckCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

import { getSession } from "@/features/auth/queries";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createNotification } from "@/features/notifications/create-notification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale, id: rentalId } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t, sp] = await Promise.all([
    getSession(),
    getTranslations("Checkout"),
    searchParams,
  ]);

  if (!session) return null;

  // If we have a Stripe session ID and webhook hasn't processed yet, process it now
  if (sp.session_id && stripe) {
    const stripeSession = await stripe.checkout.sessions.retrieve(sp.session_id);

    if (stripeSession.payment_status === "paid" && stripeSession.metadata?.rentalId === rentalId) {
      const existingPayment = await prisma.payment.findUnique({ where: { rentalId } });

      if (!existingPayment) {
        const rental = await prisma.rental.findUnique({
          where: { id: rentalId },
          select: { status: true, ownerId: true, listing: { select: { title: true } } },
        });

        if (rental && rental.status === "approved") {
          await prisma.$transaction(async (tx) => {
            await tx.payment.create({
              data: {
                rentalId,
                method: "card",
                cardLast4: "4242",
                amount: (stripeSession.amount_total || 0) / 100,
                status: "paid",
              },
            });

            await tx.rental.update({
              where: { id: rentalId },
              data: { status: "active" },
            });

            await tx.rentalEvent.create({
              data: {
                rentalId,
                status: "active",
                actorId: session.user.id,
              },
            });
          });

          createNotification({
            recipientId: rental.ownerId,
            actorId: session.user.id,
            type: "rental",
            title: `Payment received for '${rental.listing.title}'`,
            message: "The renter has completed payment via Stripe. The rental is now active.",
            linkUrl: `/rentals`,
          }).catch(() => {});
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <Card className="text-center">
        <CardContent className="py-12">
          <CheckCircle className="mx-auto size-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold">{t("paymentSuccess")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("successDescription")}
          </p>
          <Button asChild className="mt-6">
            <Link href={`/rentals/${rentalId}`}>
              {t("viewRental")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
