/**
 * FTS5 query builder, Levenshtein distance, typo suggestion, and highlight term extraction.
 *
 * Pure utility functions for search -- no database access.
 */

/**
 * Build an FTS5 MATCH query from user input.
 *
 * - Strips FTS5 special characters ("*() )
 * - Terms with 3+ chars get prefix wildcard: "term"*
 * - Terms with 1-2 chars get exact match: "term"
 * - Multiple terms joined with AND
 * - Returns empty string for empty/whitespace input
 */
export function buildFtsQuery(userQuery: string): string {
  const terms = userQuery
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (terms.length === 0) return "";

  return terms
    .map((t) => {
      // Strip FTS5 special characters
      const escaped = t.replace(/["*()]/g, "");
      if (escaped.length === 0) return null;
      // 3+ chars: prefix wildcard for stemming; 1-2 chars: exact match
      if (escaped.length >= 3) {
        return `"${escaped}"*`;
      }
      return `"${escaped}"`;
    })
    .filter(Boolean)
    .join(" AND ");
}

/**
 * Standard Levenshtein distance (dynamic programming).
 * Returns the minimum number of single-character edits (insert, delete, substitute)
 * required to transform string s into string t.
 */
export function levenshteinDistance(s: string, t: string): number {
  const m = s.length;
  const n = t.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (s[i - 1] !== t[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

/**
 * Suggest a corrected query when the user has typos.
 *
 * For each term in the query, find the closest dictionary word by Levenshtein distance.
 * Max distance: 1 for terms <= 4 chars, 2 for longer terms.
 * Skips terms that are exact matches (distance 0).
 * Returns the full corrected query, or null if no corrections were made.
 */
export function suggestCorrection(
  query: string,
  dictionary: string[]
): string | null {
  const terms = query.toLowerCase().split(/\s+/);
  let anyCorrected = false;

  const corrected = terms.map((term) => {
    const maxDist = term.length <= 4 ? 1 : 2;
    let bestWord: string | null = null;
    let bestDist = Infinity;

    for (const word of dictionary) {
      const dist = levenshteinDistance(term, word.toLowerCase());
      if (dist === 0) {
        // Exact match -- no correction needed for this term
        bestWord = null;
        bestDist = 0;
        break;
      }
      if (dist <= maxDist && dist < bestDist) {
        bestDist = dist;
        bestWord = word.toLowerCase();
      }
    }

    if (bestWord) {
      anyCorrected = true;
      return bestWord;
    }
    return term;
  });

  return anyCorrected ? corrected.join(" ") : null;
}

/**
 * Extract unique lowercase terms from a search query for client-side highlighting.
 */
export function extractHighlightTerms(query: string): string[] {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.toLowerCase());
  return [...new Set(terms)];
}
