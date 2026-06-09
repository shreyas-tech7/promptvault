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

  const { error } = await supabase
    .from("prompts")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    return { error: error.message };
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

  const parsed = parsePrompt(formData);
  if (!parsed.ok) return parsed.state;

  const { error } = await supabase
    .from("prompts")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
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

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
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

  const { data: existing, error: selectError } = await supabase
    .from("upvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (selectError) {
    return { error: selectError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("upvotes")
      .insert({ user_id: user.id, prompt_id: promptId });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
}
