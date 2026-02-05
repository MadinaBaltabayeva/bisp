/**
 * FTS5 virtual table management for full-text search.
 *
 * Provides table setup, upsert/delete/search helpers, and dictionary extraction.
 * Uses Prisma $executeRawUnsafe/$queryRawUnsafe for FTS5 operations.
 */

import { prisma } from "@/lib/db";

let ftsInitialized = false;

/**
 * Create the FTS5 virtual table if it doesn't exist.
 * Uses module-level boolean to skip on subsequent calls.
 */
export async function ensureFtsTable(): Promise<void> {
  if (ftsInitialized) return;
  await prisma.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE IF NOT EXISTS listing_search USING fts5(
      listing_id UNINDEXED,
      title_en,
      title_ru,
      title_uz,
      desc_en,
      desc_ru,
      desc_uz,
      tags,
      tokenize='unicode61'
    )
  `);
  ftsInitialized = true;
}

/**
 * Upsert a listing entry in the FTS5 table (delete then insert).
 */
export async function upsertFtsEntry(
  listingId: string,
  data: {
    titleEn: string;
    titleRu: string;
    titleUz: string;
    descEn: string;
    descRu: string;
    descUz: string;
    tags: string;
  }
): Promise<void> {
  await ensureFtsTable();
  await prisma.$executeRawUnsafe(
    `DELETE FROM listing_search WHERE listing_id = ?`,
    listingId
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO listing_search(listing_id, title_en, title_ru, title_uz, desc_en, desc_ru, desc_uz, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    listingId,
    data.titleEn,
    data.titleRu,
    data.titleUz,
    data.descEn,
    data.descRu,
    data.descUz,
    data.tags
  );
}

/**
 * Delete a listing entry from the FTS5 table.
 */
export async function deleteFtsEntry(listingId: string): Promise<void> {
  await ensureFtsTable();
  await prisma.$executeRawUnsafe(
    `DELETE FROM listing_search WHERE listing_id = ?`,
    listingId
  );
}

/**
 * Search the FTS5 table with BM25 ranking.
 *
 * Column weights: listing_id=0 (UNINDEXED), title_en=10, title_ru=10, title_uz=10,
 *                 desc_en=5, desc_ru=5, desc_uz=5, tags=1
 *
 * Returns results sorted by rank ASC (more negative = better match).
 */
export async function ftsSearch(
  query: string,
  limit: number = 100
): Promise<{ listing_id: string; rank: number }[]> {
  await ensureFtsTable();
  const results = await prisma.$queryRawUnsafe<
    { listing_id: string; rank: number }[]
  >(
    `SELECT listing_id, bm25(listing_search, 0, 10.0, 10.0, 10.0, 5.0, 5.0, 5.0, 1.0) as rank
     FROM listing_search
     WHERE listing_search MATCH ?
     ORDER BY rank
     LIMIT ?`,
    query,
    limit
  );
  return results;
}

// Dictionary cache with 5-minute TTL
let dictionaryCache: string[] | null = null;
let dictionaryCacheTime = 0;
const DICTIONARY_TTL_MS = 5 * 60 * 1000;

/**
 * Get a dictionary of unique words from all title columns in the FTS table.
 * Cached in memory with 5-minute TTL for Levenshtein comparison.
 */
export async function getDictionary(): Promise<string[]> {
  const now = Date.now();
  if (dictionaryCache && now - dictionaryCacheTime < DICTIONARY_TTL_MS) {
    return dictionaryCache;
  }

  await ensureFtsTable();

  // Extract distinct words from title columns by selecting all titles
  // and splitting them into individual words
  const rows = await prisma.$queryRawUnsafe<
    {
      title_en: string | null;
      title_ru: string | null;
      title_uz: string | null;
    }[]
  >(
    `SELECT title_en, title_ru, title_uz FROM listing_search`
  );

  const wordSet = new Set<string>();
  for (const row of rows) {
    for (const val of [row.title_en, row.title_ru, row.title_uz]) {
      if (val) {
        for (const word of val.toLowerCase().split(/\s+/)) {
          if (word.length >= 2) {
            wordSet.add(word);
          }
        }
      }
    }
  }

  dictionaryCache = [...wordSet];
  dictionaryCacheTime = now;
  return dictionaryCache;
}
