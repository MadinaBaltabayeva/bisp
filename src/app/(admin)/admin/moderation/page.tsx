import { getFlaggedListings } from "@/features/admin/queries";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export default async function AdminModerationPage() {
  const flaggedListings = await getFlaggedListings();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <p className="text-sm text-muted-foreground">
          {flaggedListings.length} flagged item
          {flaggedListings.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {/* Moderation Content */}
      <ModerationQueue listings={flaggedListings} />
    </div>
  );
}
