-- AI planner and AI-written university profiles.

-- ---------------------------------------------------------------- university_profiles
-- One generated profile per university (overview, strengths, student life, tips…).
-- Public reference data like `universities`: everyone reads, only the server writes.
create table public.university_profiles (
  university_id bigint primary key references public.universities (id) on delete cascade,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  model text,
  generated_at timestamptz not null default now()
);

grant select on public.university_profiles to anon, authenticated;
alter table public.university_profiles enable row level security;

create policy "University profiles are readable by everyone"
  on public.university_profiles for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------- plans
-- Study / exam / admission plans generated for a student. `done` holds the keys
-- of finished tasks, so regenerating content never needs a second table.
create table public.plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('admission', 'exam', 'study', 'portfolio', 'essay', 'custom')),
  title text not null check (char_length(title) between 1 and 160),
  params jsonb not null default '{}'::jsonb check (jsonb_typeof(params) = 'object'),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  done text[] not null default '{}',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plans_user_id_created_at_idx on public.plans (user_id, created_at desc);

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function private.set_updated_at();

grant select, insert, delete on public.plans to authenticated;
-- progress and the name are the only things a student changes after generation
grant update (done, title) on public.plans to authenticated;
alter table public.plans enable row level security;

create policy "Students read their own plans"
  on public.plans for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students create their own plans"
  on public.plans for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students update their own plans"
  on public.plans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Students delete their own plans"
  on public.plans for delete
  to authenticated
  using ((select auth.uid()) = user_id);
-- UniRoute · supabase/migrations/20260918134758_planner_and_university_profiles.sql
