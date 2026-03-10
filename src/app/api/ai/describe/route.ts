import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { generateListingDescription } from "@/features/listings/ai";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await generateListingDescription(imageBase64);
    if (!result) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
