# PromptVault

A clean, modern web app to **save, organize and upvote your favorite AI prompts**
(Coding, Writing, Image Generation and more).

Built with **Next.js 16 (App Router + Server Actions)**, **Supabase** (auth +
Postgres + RLS), **Tailwind CSS v4** and **shadcn/ui**.

## Features

- 🔐 **Authentication** — email/password sign up, log in, log out, with route
  protection via Next.js `proxy` (the Next 16 replacement for middleware).
- 📰 **Public feed** — anyone can browse and search prompts. Creating or
  upvoting requires an account (you're redirected to log in).
- ✍️ **Full CRUD** — create, edit and delete prompts through Server Actions with
  interactive toast notifications.
- ⬆️ **Upvotes** — one vote per user per prompt, enforced by a unique constraint.
- 🔎 **Live search & filtering** — instant client-side filtering by text and
  category tabs.

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Server Actions)           |
| Language     | TypeScript (strict)                               |
| Styling / UI | Tailwind CSS v4 + shadcn/ui                        |
| Backend / DB | Supabase (`@supabase/ssr` for SSR auth) + Postgres |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project & run the schema

1. Create a project at [app.supabase.com](https://app.supabase.com).
2. Open the **SQL Editor**, paste the contents of [`schema.sql`](./schema.sql),
   and run it. This creates the `profiles`, `prompts` and `upvotes` tables, all
   Row Level Security policies, and a trigger that auto-creates a profile on
   sign-up.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your project's values from
**Project Settings → API**:

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> The repo ships with placeholder values in `.env.local` so the app builds out
> of the box — replace them with real credentials to enable auth and data.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Email confirmation:** by default Supabase requires email confirmation on
> sign-up. For the smoothest local experience, disable it under
> **Authentication → Providers → Email → Confirm email**, or use the link sent
> to your inbox (handled by `/auth/callback`).

## Project structure

```
app/
  (auth)/             # /login, /signup — centered auth layout
  (main)/             # feed + prompt pages, with navbar/footer
    page.tsx          # public, searchable prompt feed
    prompts/new       # create (protected)
    prompts/[id]      # prompt detail (public)
    prompts/[id]/edit # edit (protected, owner only)
  auth/
    actions.ts        # login / signup / logout server actions
    callback/route.ts # email confirmation code exchange
  prompts/
    actions.ts        # create / update / delete / upvote server actions
components/
  ui/                 # shadcn/ui components
  prompts/            # feed, card, form, upvote, copy, delete
  auth/               # login & signup forms
  layout/             # navbar + user menu
lib/
  supabase/           # browser, server & proxy clients
  data.ts             # prompt data-access helpers
  types.ts            # shared types & categories
proxy.ts              # session refresh + route protection (Next 16)
schema.sql            # full Postgres schema + RLS
```

## Scripts

| Command         | Description               |
| --------------- | ------------------------- |
| `npm run dev`   | Start the dev server      |
| `npm run build` | Production build          |
| `npm run start` | Run the production build  |
| `npm run lint`  | Lint with ESLint          |
