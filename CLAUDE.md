@AGENTS.md

# PromptVault — dev guide

## Commands
```
npm run dev     # Next.js 16 dev server → http://localhost:3000
npm run build   # production build
npm run lint    # ESLint (eslint-config-next)
npx tsc --noEmit  # type-check without building
```

## Stack
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **Auth + DB:** Supabase via `@supabase/ssr` (SSR-safe client)
- **UI:** base-ui + shadcn components, Lucide icons, Sonner toasts
- **Deployed:** Vercel — see `proxy.ts` (replaces middleware, important gotcha)

## Architecture
- Server components by default — add `'use client'` only when state/effects needed.
- Route handlers: `app/api/*/route.ts`
- Supabase client: `lib/supabase/client.ts` (browser) · `lib/supabase/server.ts` (RSC/route handlers)
- DB schema: `schema.sql` at project root — source of truth for table shapes.

## Before touching the DB
Use MCP Supabase tools first:
- `list_tables` — see current schema
- `get_advisors` — lint for security / perf issues
- `get_logs` — runtime errors

## Deployment
- `vercel deploy` or push to main → Vercel auto-deploys.
- Check `.env.local` for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Vercel env vars must match — use Vercel MCP or dashboard to verify.
