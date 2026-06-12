-- ============================================================================
-- PromptVault — Supabase / PostgreSQL schema
-- ----------------------------------------------------------------------------
-- Paste this whole file into the Supabase SQL Editor and run it.
-- It is idempotent: you can run it again safely.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (available on Supabase by default).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- profiles  (one row per auth.users row)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  username   text        not null check (char_length(username) between 1 and 50),
  created_at timestamptz not null default now()
);

-- Backfill the length constraint on databases created before it was added.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_length'
  ) then
    alter table public.profiles
      add constraint profiles_username_length
      check (char_length(username) between 1 and 50);
  end if;
end $$;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- prompts
-- ----------------------------------------------------------------------------
create table if not exists public.prompts (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title      text        not null check (char_length(title) between 1 and 120),
  body       text        not null check (char_length(body) between 1 and 5000),
  category   text        not null,
  user_id    uuid        not null references public.profiles (id) on delete cascade
);

create index if not exists prompts_user_id_idx    on public.prompts (user_id);
create index if not exists prompts_category_idx    on public.prompts (category);
create index if not exists prompts_created_at_idx  on public.prompts (created_at desc);

alter table public.prompts enable row level security;

drop policy if exists "Prompts are viewable by everyone" on public.prompts;
create policy "Prompts are viewable by everyone"
  on public.prompts
  for select
  using (true);

drop policy if exists "Authenticated users can create prompts" on public.prompts;
create policy "Authenticated users can create prompts"
  on public.prompts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own prompts" on public.prompts;
create policy "Users can update their own prompts"
  on public.prompts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own prompts" on public.prompts;
create policy "Users can delete their own prompts"
  on public.prompts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- upvotes  (one per user per prompt — enforced by the unique constraint)
-- ----------------------------------------------------------------------------
create table if not exists public.upvotes (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  prompt_id  uuid        not null references public.prompts (id)  on delete cascade,
  unique (user_id, prompt_id)
);

create index if not exists upvotes_prompt_id_idx on public.upvotes (prompt_id);
create index if not exists upvotes_user_id_idx   on public.upvotes (user_id);

alter table public.upvotes enable row level security;

drop policy if exists "Upvotes are viewable by everyone" on public.upvotes;
create policy "Upvotes are viewable by everyone"
  on public.upvotes
  for select
  using (true);

drop policy if exists "Authenticated users can upvote" on public.upvotes;
create policy "Authenticated users can upvote"
  on public.upvotes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own upvotes" on public.upvotes;
create policy "Users can remove their own upvotes"
  on public.upvotes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Auto-create a profile whenever a new auth user signs up.
-- Uses the `username` from sign-up metadata, falling back to the email handle.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- This is a SECURITY DEFINER function, so by default it is exposed through the
-- PostgREST RPC endpoint (`/rest/v1/rpc/handle_new_user`) and any client could
-- invoke it directly. It is only ever meant to run from the trigger below
-- (which fires regardless of EXECUTE privileges), so lock out direct callers.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
