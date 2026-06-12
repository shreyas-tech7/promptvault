"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

/** Only allow redirects to internal paths (prevents open-redirect abuse). */
function safeRedirect(value: FormDataEntryValue | null): string {
  const target = typeof value === "string" ? value : "/";
  return target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export async function login(
  _prevState: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(formData.get("redirectTo"));

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(
  _prevState: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(formData.get("redirectTo"));

  if (username.length < 2) {
    return { error: "Username must be at least 2 characters long." };
  }
  if (username.length > 50) {
    return { error: "Username must be 50 characters or fewer." };
  }
  if (!email) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Server Actions have no `window`, so the app's public origin comes from env.
  // Must match the Site URL configured in the Supabase dashboard.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is required, no session is returned yet.
  if (!data.session) {
    return {
      message:
        "Almost there! Check your inbox to confirm your email, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
