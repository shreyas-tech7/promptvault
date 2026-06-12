"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search, Sparkles } from "lucide-react";
import type { PromptWithMeta } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptCard } from "@/components/prompts/prompt-card";

const ALL = "all";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "top", label: "Most upvoted" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function Feed({
  prompts,
  isAuthenticated,
  currentUserId,
}: {
  prompts: PromptWithMeta[];
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [sort, setSort] = useState<SortValue>("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = prompts.filter((prompt) => {
      const matchesCategory = category === ALL || prompt.category === category;
      const matchesQuery =
        q.length === 0 ||
        prompt.title.toLowerCase().includes(q) ||
        prompt.body.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    if (sort === "top") {
      // Stable copy-sort: ties keep the incoming newest-first order.
      return [...matches].sort((a, b) => b.upvotes - a.upvotes);
    }
    return matches;
  }, [prompts, query, category, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts by title or content…"
            className="h-10 pl-9"
            aria-label="Search prompts"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={category}
            onValueChange={(value) => setCategory(value as string)}
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start">
              <TabsTrigger value={ALL}>All</TabsTrigger>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Select
            items={SORT_OPTIONS}
            value={sort}
            onValueChange={(value) => setSort(value as SortValue)}
          >
            <SelectTrigger aria-label="Sort prompts">
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasPrompts={prompts.length > 0} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "prompt" : "prompts"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isAuthenticated={isAuthenticated}
                isOwner={prompt.user_id === currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ hasPrompts }: { hasPrompts: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Sparkles className="size-6" />
      </span>
      <h2 className="font-heading text-lg font-medium">
        {hasPrompts ? "No matching prompts" : "No prompts yet"}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasPrompts
          ? "Try a different search term or category."
          : "Be the first to share a great prompt with the community."}
      </p>
    </div>
  );
}
