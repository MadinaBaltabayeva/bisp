import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCategoryPriceStats } from "@/features/listings/queries";

/**
 * GET /api/pricing/suggest?categoryId=xxx&excludeId=yyy
 * Returns category price statistics for AI pricing suggestions.
 */
export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const excludeId = request.nextUrl.searchParams.get("excludeId");

  if (!categoryId) {
    return NextResponse.json(null);
  }

  const result = await getCategoryPriceStats(
    categoryId,
    excludeId || undefined
  );

  return NextResponse.json(result);
}
