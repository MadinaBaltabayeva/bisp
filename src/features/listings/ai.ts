import { openai, isAIEnabled } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { upsertFtsEntry } from "@/lib/search";
import { readFile } from "fs/promises";
import { join } from "path";

const VALID_CATEGORY_SLUGS = [
  "tools",
  "electronics",
  "sports",
  "outdoor",
  "vehicles",
  "clothing",
  "music",
  "home-garden",
] as const;

/**
 * Moderate a listing using OpenAI's omni-moderation model.
 * Runs asynchronously after listing publish. Updates listing status based on results.
 */
export async function moderateListing(listingId: string): Promise<void> {
  if (!isAIEnabled() || !openai) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: { take: 3, orderBy: { sortOrder: "asc" } } },
  });

  if (!listing) return;

  // Build multi-modal input
  const inputs: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `Listing Title: ${listing.title}\nDescription: ${listing.description}`,
    },
  ];

  // Add images as base64 if they exist on disk
  for (const image of listing.images) {
    try {
      const filePath = join(process.cwd(), "public", image.url);
      const buffer = await readFile(filePath);
      const base64 = buffer.toString("base64");
      const ext = image.url.split(".").pop() || "jpeg";
      const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      inputs.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
        },
      });
    } catch {
      // Skip images that can't be read
    }
  }

  try {
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: inputs,
    });

    const result = moderation.results[0];
    const isFlagged = result.flagged;

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: isFlagged ? "under_review" : "active",
        aiVerified: !isFlagged,
        moderationResult: JSON.stringify(result.categories),
      },
    });
  } catch (error) {
    console.error("Moderation failed for listing:", listingId, error);
  }
}

/**
 * Suggest category and tags from a photo using GPT-4o-mini vision.
 * Returns null if AI is not enabled or on error.
 */
export async function suggestCategoryAndTags(
  imageBase64: string
): Promise<{ category: string | null; tags: string[] } | null> {
  if (!isAIEnabled() || !openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image of an item for rent. Return JSON with:
- "category": one of these slugs: ${VALID_CATEGORY_SLUGS.join(", ")} (or null if unsure)
- "tags": up to 5 descriptive tags as strings

Return ONLY valid JSON.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      category?: string;
      tags?: string[];
    };

    // Validate category is one of the allowed slugs
    const category =
      parsed.category &&
      VALID_CATEGORY_SLUGS.includes(
        parsed.category as (typeof VALID_CATEGORY_SLUGS)[number]
      )
        ? parsed.category
        : null;

    // Ensure tags is an array of strings, max 5
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === "string").slice(0, 5)
      : [];

    return { category, tags };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return null;
  }
}

/**
 * Translate listing title and description to English, Russian, and Uzbek using GPT-4o-mini.
 * Returns null if AI is disabled or on error (graceful degradation).
 */
export async function translateListingText(
  title: string,
  description: string
): Promise<{
  en: { title: string; description: string };
  ru: { title: string; description: string };
  uz: { title: string; description: string };
} | null> {
  if (!isAIEnabled() || !openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Translate the following listing title and description into English, Russian, and Uzbek. Return ONLY valid JSON with this structure:
{
  "en": { "title": "...", "description": "..." },
  "ru": { "title": "...", "description": "..." },
  "uz": { "title": "...", "description": "..." }
}

Title: ${title}
Description: ${description}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      en: { title: string; description: string };
      ru: { title: string; description: string };
      uz: { title: string; description: string };
    };

    return parsed;
  } catch (error) {
    console.error("Translation failed:", error);
    return null;
  }
}

/**
 * Translate title and description to a single target locale with language detection.
 * Returns null if AI is disabled or on error (graceful degradation).
 */
export async function translateForLocale(
  title: string,
  description: string,
  targetLocale: string
): Promise<{
  detectedLanguage: string;
  translatedTitle: string;
  translatedDescription: string;
} | null> {
  if (!isAIEnabled() || !openai) return null;

  const localeNames: Record<string, string> = {
    en: "English",
    ru: "Russian",
    uz: "Uzbek",
  };
  const targetLang = localeNames[targetLocale] || "English";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Detect the language of the following text and translate it to ${targetLang}.
Return ONLY valid JSON:
{
  "detectedLanguage": "<ISO 639-1 code, e.g. en, ru, uz>",
  "translatedTitle": "<translated title>",
  "translatedDescription": "<translated description>"
}

Title: ${title}
Description: ${description}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.error("Translation failed:", error);
    return null;
  }
}

/**
 * Translate a listing and sync it into the FTS5 index.
 * Falls back to indexing original text in all columns if AI is unavailable.
 */
export async function translateAndIndexListing(
  listingId: string
): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, description: true, tags: true },
  });

  if (!listing) return;

  const translations = await translateListingText(
    listing.title,
    listing.description
  );

  if (translations) {
    await upsertFtsEntry(listingId, {
      titleEn: translations.en.title,
      titleRu: translations.ru.title,
      titleUz: translations.uz.title,
      descEn: translations.en.description,
      descRu: translations.ru.description,
      descUz: translations.uz.description,
      tags: listing.tags || "",
    });
  } else {
    // AI disabled or error -- index original text in all columns for basic FTS
    await upsertFtsEntry(listingId, {
      titleEn: listing.title,
      titleRu: listing.title,
      titleUz: listing.title,
      descEn: listing.description,
      descRu: listing.description,
      descUz: listing.description,
      tags: listing.tags || "",
    });
  }
}
