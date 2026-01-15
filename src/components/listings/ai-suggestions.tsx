"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AISuggestionsProps {
  suggestion: { category: string | null; tags: string[] } | null;
  loading: boolean;
  onCategorySelect: (categorySlug: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export function AISuggestions({
  suggestion,
  loading,
  onCategorySelect,
  onTagsChange,
}: AISuggestionsProps) {
  const [tagInput, setTagInput] = useState("");
  const [categoryApplied, setCategoryApplied] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Sparkles className="size-4 animate-pulse text-primary" />
        <span className="text-sm text-muted-foreground">
          AI analyzing your photo...
        </span>
        <div className="ml-auto flex gap-1">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!suggestion || (!suggestion.category && suggestion.tags.length === 0)) {
    return null;
  }

  function handleCategoryClick() {
    if (suggestion?.category) {
      onCategorySelect(suggestion.category);
      setCategoryApplied(true);
    }
  }

  function removeTag(index: number) {
    if (!suggestion) return;
    const newTags = suggestion.tags.filter((_, i) => i !== index);
    onTagsChange(newTags);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (tag && suggestion) {
        const newTags = [...suggestion.tags, tag];
        onTagsChange(newTags);
        setTagInput("");
      }
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-medium">AI Suggested</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {suggestion.category && (
          <button
            type="button"
            onClick={handleCategoryClick}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              categoryApplied
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-muted bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            Category:{" "}
            <span className="capitalize">
              {suggestion.category.replace(/-/g, " ")}
            </span>
            {categoryApplied && (
              <span className="text-[10px] text-primary/70">Applied</span>
            )}
          </button>
        )}

        {suggestion.tags.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-0.5 rounded-full hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        <Input
          type="text"
          placeholder="Add tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          className="h-7 w-24 text-xs"
        />
      </div>
    </div>
  );
}
