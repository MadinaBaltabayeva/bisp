import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createNotification } from "@/features/notifications/create-notification";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development without webhook secret, parse directly
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const rentalId = session.metadata?.rentalId;
    const userId = session.metadata?.userId;

    if (!rentalId || !userId) {
      console.error("Missing metadata in Stripe session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Check if payment already processed (idempotency)
    const existingPayment = await prisma.payment.findUnique({ where: { rentalId } });
    if (existingPayment) {
      return NextResponse.json({ received: true });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      select: {
        status: true,
        ownerId: true,
        totalPrice: true,
        securityDeposit: true,
        listing: { select: { title: true } },
      },
    });

    if (!rental || rental.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    // Process payment in transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          rentalId,
          method: "card",
          cardLast4: (session.payment_method_types?.[0] || "card").slice(-4).padStart(4, "•"),
          amount: (session.amount_total || 0) / 100,
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
          actorId: userId,
        },
      });
    });

    // Notify owner
    createNotification({
      recipientId: rental.ownerId,
      actorId: userId,
      type: "rental",
      title: `Payment received for '${rental.listing.title}'`,
      message: "The renter has completed payment via Stripe. The rental is now active.",
      linkUrl: `/rentals`,
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
