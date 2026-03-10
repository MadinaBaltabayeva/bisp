import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSession } from "@/features/auth/queries";
import { prisma } from "@/lib/db";
import { generateQRDataURL } from "@/lib/qr";
import { QRHandoff } from "@/components/rentals/qr-handoff";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function HandoffPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Handoff"),
  ]);

  if (!session) redirect(`/${locale}/`);

  const rental = await prisma.rental.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      handoffCode: true,
      renterId: true,
      ownerId: true,
      listing: {
        select: { title: true },
      },
      renter: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (!rental || !rental.handoffCode) redirect(`/${locale}/rentals`);

  const isOwner = session.user.id === rental.ownerId;
  const isRenter = session.user.id === rental.renterId;

  if (!isOwner && !isRenter) redirect(`/${locale}/rentals`);

  const qrData = JSON.stringify({
    rentalId: rental.id,
    code: rental.handoffCode,
    action: rental.status === "active" ? "pickup" : "return",
  });
  const qrDataURL = await generateQRDataURL(qrData);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <QRHandoff
        rental={rental}
        qrDataURL={qrDataURL}
        isOwner={isOwner}
        isRenter={isRenter}
      />
    </div>
  );
}
