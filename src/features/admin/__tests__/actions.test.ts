import { describe, it } from "vitest";

describe("Admin Actions", () => {
  // ADMN-01: User Management
  it.todo("suspendUser sets isSuspended=true");
  it.todo("unsuspendUser clears isSuspended");
  it.todo("suspendUser rejects non-admin");
  it.todo("suspendUser cannot suspend self");
  it.todo("deleteUser cascades related records");
  it.todo("deleteUser rejects non-admin");
  it.todo("getUserDeletionCounts returns correct counts");

  // ADMN-02: Content Moderation
  it.todo("approveListing sets status=active and aiVerified=true");
  it.todo("rejectListing requires reason and sets status=rejected");
  it.todo("rejectListing rejects empty reason");
});
