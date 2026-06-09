import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// In Next.js 16 the `middleware` convention was renamed to `proxy`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - common image asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
