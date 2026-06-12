import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Extra origins (besides same-origin) allowed to invoke Server Actions. */
function serverActionOrigins(): string[] {
  const origins = new Set<string>();
  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).host);
    } catch {
      // Ignore malformed env values — same-origin is always allowed anyway.
    }
  }
  return [...origins];
}

/**
 * Static security headers applied to every response. The per-request
 * Content-Security-Policy (which needs a fresh nonce) is set in `proxy.ts`.
 */
const securityHeaders = [
  // Clickjacking protection (CSP `frame-ancestors` covers modern browsers;
  // this is the fallback for older ones).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing responses into a different content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which may carry params) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop access to powerful APIs the app never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Pin clients to HTTPS for two years (ignored by browsers over plain HTTP,
  // so it's safe to send in dev too — but we only set it in production).
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version (reduces fingerprinting).
  poweredByHeader: false,
  // Defence in depth — Next.js already rejects cross-origin Server Action POSTs
  // by comparing Origin against Host; this allowlists our known good origins
  // and caps the request body to blunt large-payload DoS attempts.
  experimental: {
    serverActions: {
      allowedOrigins: serverActionOrigins(),
      bodySizeLimit: "1mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
