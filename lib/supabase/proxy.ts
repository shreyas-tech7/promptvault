import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Paths that require an authenticated user. */
function isProtected(pathname: string): boolean {
  return pathname === "/prompts/new" || pathname.endsWith("/edit");
}

/** The auth pages an already-logged-in user should be bounced away from. */
function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

/** Origin of the Supabase project, so the browser client can reach it under CSP. */
function supabaseOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  } catch {
    return "";
  }
}

/**
 * A strict, per-request Content Security Policy. `script-src` is locked to a
 * one-time nonce + `strict-dynamic` so injected inline scripts cannot execute,
 * even if an XSS string slipped past React's escaping. `style-src` keeps
 * `'unsafe-inline'` because our UI primitives (base-ui, sonner) set inline
 * styles at runtime — style injection is a far lower risk than script injection.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const connectSrc = ["'self'", supabaseOrigin()].filter(Boolean).join(" ");

  const directives = [
    `default-src 'self'`,
    // React needs `eval` for dev error overlays; never in production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    // Forcing HTTPS would break http://localhost, so only outside dev.
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ];

  return directives.join("; ");
}

/** Attach the CSP and cache headers to whatever response we end up returning. */
function withSecurityHeaders(
  response: NextResponse,
  cspValue: string,
  pathname: string,
): NextResponse {
  response.headers.set("Content-Security-Policy", cspValue);
  // Auth-sensitive pages must never be cached by a browser, CDN or proxy.
  if (isProtected(pathname) || isAuthPage(pathname)) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }
  // Responses vary per-user (session cookie), so caches must key on it.
  response.headers.append("Vary", "Cookie");
  return response;
}

/**
 * Refreshes the Supabase auth session on every request, enforces route
 * protection, and applies a per-request CSP + security headers. Called from
 * `proxy.ts` (the Next.js 16 replacement for `middleware.ts`).
 */
export async function updateSession(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspValue = buildCsp(nonce, isDev);

  // Forward the nonce + CSP to the rendering layer via request headers so
  // Next.js stamps the nonce onto every framework/page script automatically.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getClaims/getUser refreshes the session cookies. Do not run code
  // between createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users hitting a protected page → send them to /login.
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return withSecurityHeaders(
      copyCookies(supabaseResponse, NextResponse.redirect(url)),
      cspValue,
      pathname,
    );
  }

  // Authenticated users never need the auth pages.
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return withSecurityHeaders(
      copyCookies(supabaseResponse, NextResponse.redirect(url)),
      cspValue,
      pathname,
    );
  }

  return withSecurityHeaders(supabaseResponse, cspValue, pathname);
}

/** Preserve refreshed auth cookies when we return a different response. */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}
