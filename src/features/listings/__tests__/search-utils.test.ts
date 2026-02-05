import { describe, it, expect } from "vitest";
import {
  buildFtsQuery,
  levenshteinDistance,
  suggestCorrection,
  extractHighlightTerms,
} from "../search-utils";

describe("buildFtsQuery", () => {
  it('returns prefix match for single word: "drill" -> \'"drill"*\'', () => {
    expect(buildFtsQuery("drill")).toBe('"drill"*');
  });

  it('returns AND-joined prefix matches for multi-word: "power drill"', () => {
    expect(buildFtsQuery("power drill")).toBe('"power"* AND "drill"*');
  });

  it('skips single-char terms but keeps exact match: "a drill"', () => {
    // Single-char "a" gets exact match (no prefix wildcard), "drill" gets prefix
    expect(buildFtsQuery("a drill")).toBe('"a" AND "drill"*');
  });

  it("strips FTS5 special characters: 'test\"quote'", () => {
    expect(buildFtsQuery('test"quote')).toBe('"testquote"*');
  });

  it("returns empty string for empty input", () => {
    expect(buildFtsQuery("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(buildFtsQuery("   ")).toBe("");
  });

  it('returns exact match for 2-char term: "ab" -> \'"ab"\'', () => {
    expect(buildFtsQuery("ab")).toBe('"ab"');
  });

  it('returns prefix match for 3+ char term: "abc" -> \'"abc"*\'', () => {
    expect(buildFtsQuery("abc")).toBe('"abc"*');
  });
});

describe("levenshteinDistance", () => {
  it('returns 3 for "kitten" vs "sitting"', () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("drill", "drill")).toBe(0);
  });

  it('returns 2 for "bicycle" vs "bycicle"', () => {
    expect(levenshteinDistance("bicycle", "bycicle")).toBe(2);
  });
});

describe("suggestCorrection", () => {
  it('suggests "bicycle" for "bycicle"', () => {
    expect(suggestCorrection("bycicle", ["bicycle", "car", "drill"])).toBe(
      "bicycle"
    );
  });

  it("returns null when query is an exact match", () => {
    expect(suggestCorrection("drill", ["drill", "car"])).toBeNull();
  });

  it("returns null when query is too far from any dictionary word", () => {
    expect(suggestCorrection("xyzabc", ["drill", "car"])).toBeNull();
  });
});

describe("extractHighlightTerms", () => {
  it("returns lowercase unique terms from query", () => {
    expect(extractHighlightTerms("power drill")).toEqual(["power", "drill"]);
  });

  it("returns empty array for empty input", () => {
    expect(extractHighlightTerms("")).toEqual([]);
  });

  it("deduplicates terms", () => {
    expect(extractHighlightTerms("drill Drill")).toEqual(["drill"]);
  });
});
