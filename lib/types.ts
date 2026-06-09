export const CATEGORIES = [
  "Coding",
  "Writing",
  "Image Generation",
  "Marketing",
  "Productivity",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" && (CATEGORIES as readonly string[]).includes(value)
  );
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  created_at: string;
  title: string;
  body: string;
  category: string;
  user_id: string;
}

/** A prompt enriched with author + upvote info, ready to render in the UI. */
export interface PromptWithMeta extends Prompt {
  author: string | null;
  upvotes: number;
  hasUpvoted: boolean;
}
