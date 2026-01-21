import { Package } from "lucide-react";

import { getSession } from "@/features/auth/queries";
import {
  getRentalsAsRenter,
  getRentalsAsOwner,
  activateApprovedRentals,
  getPendingActionCount,
} from "@/features/rentals/queries";
import { RentalCard } from "@/components/rentals/rental-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "My Rentals",
};

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

export default async function MyRentalsPage() {
  const session = await getSession();
  if (!session) return null;

  // Auto-activate approved rentals past start date
  await activateApprovedRentals(session.user.id);

  const [renterRentals, ownerRentals, pendingCounts] = await Promise.all([
    getRentalsAsRenter(session.user.id),
    getRentalsAsOwner(session.user.id),
    getPendingActionCount(session.user.id),
  ]);

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
      ? `As Renter (${pendingCounts.asRenter})`
      : "As Renter";
  const ownerLabel =
    pendingCounts.asOwner > 0
      ? `As Owner (${pendingCounts.asOwner})`
      : "As Owner";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your rental activity
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
              message="You haven't rented anything yet. Browse listings to find items to rent."
            />
          ) : (
            <RentalGroups
              groups={renterGroups}
              role="renter"
              rentals={renterRentals as RentalItem[]}
            />
          )}
        </TabsContent>

        {/* As Owner Tab */}
        <TabsContent value="owner" className="mt-6">
          {ownerRentals.length === 0 ? (
            <EmptyState
              message="No rental requests for your listings yet."
            />
          ) : (
            <RentalGroups
              groups={ownerGroups}
              role="owner"
              rentals={ownerRentals as RentalItem[]}
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
}: {
  groups: ReturnType<typeof groupRentals>;
  role: "renter" | "owner";
  rentals: RentalItem[];
}) {
  return (
    <div className="space-y-8">
      {groups.needsAttention.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
            Needs Attention
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
            Active
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
            Completed
          </h2>
          <div className="space-y-3">
            {groups.completed.map((rental) => (
              <RentalCard key={rental.id} rental={rental} role={role} />
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
