import { Package } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import { getSession } from "@/features/auth/queries";
import {
  getRentalsAsRenter,
  getRentalsAsOwner,
  getPendingActionCount,
} from "@/features/rentals/queries";
import { hasReviewed } from "@/features/reviews/queries";
import { RentalCard } from "@/components/rentals/rental-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("rentals.title"),
    description: t("rentals.description"),
  };
}

type RentalItem = Awaited<ReturnType<typeof getRentalsAsRenter>>[number] &
  Awaited<ReturnType<typeof getRentalsAsOwner>>[number];

function groupRentals(rentals: RentalItem[], role: "renter" | "owner") {
  const needsAttention: RentalItem[] = [];
  const active: RentalItem[] = [];
  const completed: RentalItem[] = [];

  for (const rental of rentals) {
    if (role === "owner" && rental.status === "requested") {
      needsAttention.push(rental);
    } else if (role === "renter" && rental.status === "approved") {
      needsAttention.push(rental);
    } else if (rental.status === "active") {
      active.push(rental);
    } else {
      // requested (for renter viewing), approved (for owner viewing), returned, completed, declined
      if (
        rental.status === "returned" ||
        rental.status === "completed" ||
        rental.status === "declined"
      ) {
        completed.push(rental);
      } else {
        // requested/approved that don't need attention go to active/pending section
        active.push(rental);
      }
    }
  }

  return { needsAttention, active, completed };
}

export default async function MyRentalsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Rentals"),
  ]);

  if (!session) return null;

  const [renterRentals, ownerRentals, pendingCounts] = await Promise.all([
    getRentalsAsRenter(session.user.id),
    getRentalsAsOwner(session.user.id),
    getPendingActionCount(session.user.id),
  ]);

  // Check which completed rentals the user has already reviewed
  const allRentals = [...renterRentals, ...ownerRentals];
  const completedRentals = allRentals.filter((r) => r.status === "completed");
  const reviewStatuses = await Promise.all(
    completedRentals.map((r) => hasReviewed(r.id, session.user.id))
  );
  const reviewedMap = new Map<string, boolean>();
  completedRentals.forEach((r, i) => {
    reviewedMap.set(r.id, reviewStatuses[i]);
  });

  const renterGroups = groupRentals(
    renterRentals as RentalItem[],
    "renter"
  );
  const ownerGroups = groupRentals(
    ownerRentals as RentalItem[],
    "owner"
  );

  const renterLabel =
    pendingCounts.asRenter > 0
      ? t("tabs.asRenterCount", { count: pendingCounts.asRenter })
      : t("tabs.asRenter");
  const ownerLabel =
    pendingCounts.asOwner > 0
      ? t("tabs.asOwnerCount", { count: pendingCounts.asOwner })
      : t("tabs.asOwner");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs defaultValue="renter">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="renter">{renterLabel}</TabsTrigger>
          <TabsTrigger value="owner">{ownerLabel}</TabsTrigger>
        </TabsList>

        {/* As Renter Tab */}
        <TabsContent value="renter" className="mt-6">
          {renterRentals.length === 0 ? (
            <EmptyState
              message={t("empty.asRenter")}
            />
          ) : (
            <RentalGroups
              groups={renterGroups}
              role="renter"
              rentals={renterRentals as RentalItem[]}
              reviewedMap={reviewedMap}
              sectionLabels={{
                needsAttention: t("sections.needsAttention"),
                active: t("sections.active"),
                completed: t("sections.completed"),
              }}
            />
          )}
        </TabsContent>

        {/* As Owner Tab */}
        <TabsContent value="owner" className="mt-6">
          {ownerRentals.length === 0 ? (
            <EmptyState
              message={t("empty.asOwner")}
            />
          ) : (
            <RentalGroups
              groups={ownerGroups}
              role="owner"
              rentals={ownerRentals as RentalItem[]}
              reviewedMap={reviewedMap}
              sectionLabels={{
                needsAttention: t("sections.needsAttention"),
                active: t("sections.active"),
                completed: t("sections.completed"),
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RentalGroups({
  groups,
  role,
  reviewedMap,
  sectionLabels,
}: {
  groups: ReturnType<typeof groupRentals>;
  role: "renter" | "owner";
  rentals: RentalItem[];
  reviewedMap: Map<string, boolean>;
  sectionLabels: {
    needsAttention: string;
    active: string;
    completed: string;
  };
}) {
  return (
    <div className="space-y-8">
      {groups.needsAttention.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
            {sectionLabels.needsAttention}
          </h2>
          <div className="space-y-3">
            {groups.needsAttention.map((rental) => (
              <RentalCard key={rental.id} rental={rental} role={role} />
            ))}
          </div>
        </section>
      )}

      {groups.active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-600">
            {sectionLabels.active}
          </h2>
          <div className="space-y-3">
            {groups.active.map((rental) => (
              <RentalCard key={rental.id} rental={rental} role={role} />
            ))}
          </div>
        </section>
      )}

      {groups.completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {sectionLabels.completed}
          </h2>
          <div className="space-y-3">
            {groups.completed.map((rental) => (
              <RentalCard
                key={rental.id}
                rental={rental}
                role={role}
                hasReviewedByUser={reviewedMap.get(rental.id) ?? false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Package className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
