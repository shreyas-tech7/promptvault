"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCategory } from "@/lib/types";

export interface PromptFormState {
  error?: string;
  fieldErrors?: {
    title?: string;
    body?: string;
    category?: string;
  };
}

interface ParsedPrompt {
  title: string;
  body: string;
  category: string;
}

type ParseResult =
  | { ok: true; data: ParsedPrompt }
  | { ok: false; state: PromptFormState };

/** A generic message shown to users when a database write fails. We never
 * surface the raw Supabase/Postgres error, which can leak schema internals. */
const GENERIC_DB_ERROR = "Something went wrong. Please try again.";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parsePrompt(formData: FormData): ParseResult {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  const fieldErrors: NonNullable<PromptFormState["fieldErrors"]> = {};

  if (title.length < 3) {
    fieldErrors.title = "Title must be at least 3 characters long.";
  } else if (title.length > 120) {
    fieldErrors.title = "Title must be 120 characters or fewer.";
  }

  if (body.length < 10) {
    fieldErrors.body = "Prompt body must be at least 10 characters long.";
  } else if (body.length > 5000) {
    fieldErrors.body = "Prompt body must be 5000 characters or fewer.";
  }

  if (!isCategory(category)) {
    fieldErrors.category = "Please choose a category.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors } };
  }

  return { ok: true, data: { title, body, category } };
}

export async function createPrompt(
  _prevState: PromptFormState | undefined,
  formData: FormData,
): Promise<PromptFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/prompts/new");
  }

  const parsed = parsePrompt(formData);
  if (!parsed.ok) return parsed.state;

  // user_id is automatically set from the authenticated session.
  // This prevents users from creating prompts under someone else's account.
  // The database enforces this with NOT NULL + foreign key + RLS policies.
  const { error } = await supabase
    .from("prompts")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    console.error("createPrompt failed:", error);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/?toast=created");
}

export async function updatePrompt(
  id: string,
  _prevState: PromptFormState | undefined,
  formData: FormData,
): Promise<PromptFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/prompts/${id}/edit`);
  }

  if (!isUuid(id)) {
    return { error: GENERIC_DB_ERROR };
  }

  const parsed = parsePrompt(formData);
  if (!parsed.ok) return parsed.state;

  // The `user_id` filter (plus RLS) ensures users can only edit their own rows.
  const { error } = await supabase
    .from("prompts")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("updatePrompt failed:", error);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect(`/prompts/${id}?toast=updated`);
}

export async function deletePrompt(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isUuid(id)) {
    return { error: GENERIC_DB_ERROR };
  }

  // The `user_id` filter (plus RLS) ensures users can only delete their own rows.
  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("deletePrompt failed:", error);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/?toast=deleted");
}

export async function toggleUpvote(
  promptId: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upvote." };
  }

  if (!isUuid(promptId)) {
    return { error: GENERIC_DB_ERROR };
  }

  const { data: existing, error: selectError } = await supabase
    .from("upvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (selectError) {
    console.error("toggleUpvote select failed:", selectError);
    return { error: GENERIC_DB_ERROR };
  }

  if (existing) {
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);
    if (error) {
      console.error("toggleUpvote delete failed:", error);
      return { error: GENERIC_DB_ERROR };
    }
  } else {
    const { error } = await supabase
      .from("upvotes")
      .insert({ user_id: user.id, prompt_id: promptId });
    if (error) {
      console.error("toggleUpvote insert failed:", error);
      return { error: GENERIC_DB_ERROR };
    }
  }

  revalidatePath("/", "layout");
}
