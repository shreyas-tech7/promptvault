import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PromptWithMeta } from "@/lib/types";

interface RawPrompt {
  id: string;
  created_at: string;
  title: string;
  body: string;
  category: string;
  user_id: string;
  profiles: { username: string } | null;
  upvotes: { count: number }[];
}

const PROMPT_SELECT =
  "id, created_at, title, body, category, user_id, profiles(username), upvotes(count)";

function toMeta(raw: RawPrompt, upvotedIds: Set<string>): PromptWithMeta {
  return {
    id: raw.id,
    created_at: raw.created_at,
    title: raw.title,
    body: raw.body,
    category: raw.category,
    user_id: raw.user_id,
    author: raw.profiles?.username ?? null,
    upvotes: raw.upvotes?.[0]?.count ?? 0,
    hasUpvoted: upvotedIds.has(raw.id),
  };
}

async function getUpvotedIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("upvotes")
    .select("prompt_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.prompt_id as string));
}

/** Every prompt, newest first, enriched with author + upvote info. */
export async function getPrompts(
  userId: string | undefined,
): Promise<PromptWithMeta[]> {
  const supabase = await createClient();
  const [{ data }, upvotedIds] = await Promise.all([
    supabase
      .from("prompts")
      .select(PROMPT_SELECT)
      .order("created_at", { ascending: false }),
    getUpvotedIds(userId),
  ]);

  return ((data ?? []) as unknown as RawPrompt[]).map((raw) =>
    toMeta(raw, upvotedIds),
  );
}

/** A single prompt by id, or null if it does not exist. */
export async function getPrompt(
  id: string,
  userId: string | undefined,
): Promise<PromptWithMeta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompts")
    .select(PROMPT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const upvotedIds = await getUpvotedIds(userId);
  return toMeta(data as unknown as RawPrompt, upvotedIds);
}
