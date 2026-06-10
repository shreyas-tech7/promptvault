import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow redirects to internal paths (prevents open-redirect abuse). */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/**
 * Handles the redirect back from Supabase email confirmation / magic links.
 * Exchanges the `code` for a session, then forwards the user on.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = next === "/" ? "/?toast=confirmed" : next;
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  // Supabase reports expired/invalid links via error_description.
  const description = searchParams.get("error_description");
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      description ?? "Sorry, we couldn't sign you in. Please try again.",
    )}`,
  );
}
