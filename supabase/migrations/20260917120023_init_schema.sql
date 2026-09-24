-- =====================================================================
-- UniRoute — initial schema
-- users · profiles · universities · scholarships · roadmaps
-- roadmap_steps · shortlist · chat_messages
--
-- Data API exposure is opt-in (Supabase change 2026-04-28), so every
-- table below revokes the default grants and re-grants explicitly.
-- RLS is enabled on every table in `public`.
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- users: public mirror of auth.users (created by trigger on sign-up)
-- ---------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function private.set_updated_at();

-- Runs as table owner because the auth service inserts into auth.users.
-- Lives in the unexposed `private` schema and cannot be called via RPC.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- profiles: questionnaire answers (one per user)
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,

  -- who
  grade smallint check (grade between 7 and 12),
  age smallint check (age between 10 and 30),
  citizenship text,
  residence_country text,

  -- what they like
  interests text[] not null default '{}',
  intended_major text,

  -- academics
  gpa numeric(5, 2) check (gpa >= 0),
  gpa_scale smallint not null default 5 check (gpa_scale in (4, 5, 10, 100)),
  -- [{ "language": "English", "level": "B2" }]
  languages jsonb not null default '[]'::jsonb check (jsonb_typeof(languages) = 'array'),
  -- [{ "type": "IELTS", "score": 6.5, "status": "taken" | "planned", "date": "2026-11-01" }]
  exams jsonb not null default '[]'::jsonb check (jsonb_typeof(exams) = 'array'),
  -- [{ "title": "Олимпиада по физике", "kind": "olympiad", "level": "regional" }]
  activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),

  -- where / how much / when
  target_countries text[] not null default '{}',
  budget_usd_per_year integer check (budget_usd_per_year >= 0),
  needs_scholarship boolean not null default false,
  start_year smallint check (start_year between 2025 and 2035),

  -- limits and goal
  constraints text[] not null default '{}',
  constraints_note text,
  goal text,
  assistant_style text not null default 'friendly'
    check (assistant_style in ('friendly', 'mentor', 'strict', 'concise')),

  -- bumps on every change so recommendations/roadmap know they are stale
  version integer not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_gpa_within_scale check (gpa is null or gpa <= gpa_scale)
);

create or replace function private.bump_profile_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  return new;
end;
$$;

create trigger profiles_bump_version
  before update on public.profiles
  for each row execute function private.bump_profile_version();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- universities: reference data (read-only for clients)
-- ---------------------------------------------------------------------

create table public.universities (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  name_ru text,
  country text not null,
  country_code char(2) not null,
  city text not null,

  qs_rank integer check (qs_rank > 0),
  acceptance_rate numeric(5, 2) check (acceptance_rate between 0 and 100),

  -- money, USD per academic year (international students)
  tuition_usd_per_year integer not null check (tuition_usd_per_year >= 0),
  living_cost_usd_per_year integer not null check (living_cost_usd_per_year >= 0),

  -- entry requirements ("проходные баллы"); GPA normalised to a 4.0 scale
  min_gpa_4 numeric(3, 2) check (min_gpa_4 between 0 and 4),
  avg_gpa_4 numeric(3, 2) check (avg_gpa_4 between 0 and 4),
  min_ielts numeric(2, 1) check (min_ielts between 0 and 9),
  min_toefl smallint check (min_toefl between 0 and 120),
  sat_required boolean not null default false,
  sat_recommended smallint check (sat_recommended between 400 and 1600),
  entrance_exams text[] not null default '{}',
  requires_foundation boolean not null default false,
  foundation_note text,

  instruction_languages text[] not null default '{English}',
  fields text[] not null default '{}',
  programs text[] not null default '{}',

  scholarship_level text not null
    check (scholarship_level in ('full', 'partial', 'limited', 'none')),
  scholarship_note text,

  -- [{ "label": "Early Action", "month": 11, "day": 1 }]
  application_deadlines jsonb not null default '[]'::jsonb
    check (jsonb_typeof(application_deadlines) = 'array'),
  intake text,

  description text,
  highlights text[] not null default '{}',

  image_url text not null,
  image_credit text,
  image_source_url text,
  website_url text not null,
  admissions_url text,

  data_source text,
  is_demo boolean not null default true,
  data_updated_at date,
  created_at timestamptz not null default now()
);

create index universities_country_code_idx on public.universities (country_code);
create index universities_fields_idx on public.universities using gin (fields);

-- ---------------------------------------------------------------------
-- scholarships: reference data (read-only for clients)
-- ---------------------------------------------------------------------

create table public.scholarships (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  provider text not null,
  country_code char(2),
  university_id bigint references public.universities (id) on delete set null,
  coverage text not null check (coverage in ('full', 'tuition', 'partial', 'stipend')),
  amount_note text,
  -- ISO country codes; null = open to any citizenship
  eligible_citizenships text[],
  min_gpa_4 numeric(3, 2) check (min_gpa_4 between 0 and 4),
  min_ielts numeric(2, 1) check (min_ielts between 0 and 9),
  need_based boolean not null default false,
  -- { "label": "...", "month": 1, "day": 15 }
  deadline jsonb,
  description text,
  url text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create index scholarships_university_id_idx on public.scholarships (university_id);
create index scholarships_country_code_idx on public.scholarships (country_code);

-- ---------------------------------------------------------------------
-- roadmaps + roadmap_steps: personal plan and progress
-- ---------------------------------------------------------------------

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  profile_version integer not null,
  target_university_ids bigint[] not null default '{}',
  -- diagnosis snapshot: strengths, limits, goal, chances
  summary jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- lets roadmap_steps reference (id, user_id) so a step can never
  -- point at another user's roadmap
  unique (id, user_id)
);

create trigger roadmaps_set_updated_at
  before update on public.roadmaps
  for each row execute function private.set_updated_at();

create table public.roadmap_steps (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null,
  user_id uuid not null,
  -- stable key so progress survives roadmap regeneration (upsert on it)
  step_key text not null,
  category text not null
    check (category in ('exam', 'document', 'application', 'deadline', 'academic', 'activity', 'scholarship')),
  title text not null,
  description text,
  due_date date,
  university_id bigint references public.universities (id) on delete set null,
  priority smallint not null default 2 check (priority between 1 and 3),
  sort_order integer not null default 0,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (roadmap_id, step_key),
  foreign key (roadmap_id, user_id)
    references public.roadmaps (id, user_id) on delete cascade
);

create index roadmap_steps_user_status_due_idx
  on public.roadmap_steps (user_id, status, due_date);
create index roadmap_steps_university_id_idx on public.roadmap_steps (university_id);

create trigger roadmap_steps_set_updated_at
  before update on public.roadmap_steps
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- shortlist: universities the user saved / compares
-- ---------------------------------------------------------------------

create table public.shortlist (
  user_id uuid not null references public.users (id) on delete cascade,
  university_id bigint not null references public.universities (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, university_id)
);

create index shortlist_university_id_idx on public.shortlist (university_id);

-- ---------------------------------------------------------------------
-- chat_messages: AI assistant history
-- ---------------------------------------------------------------------

create table public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  style text,
  created_at timestamptz not null default now()
);

create index chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

-- =====================================================================
-- Grants (explicit — nothing is exposed by default)
-- =====================================================================

revoke all on
  public.users, public.profiles, public.universities, public.scholarships,
  public.roadmaps, public.roadmap_steps, public.shortlist, public.chat_messages
from anon, authenticated;

grant all on
  public.users, public.profiles, public.universities, public.scholarships,
  public.roadmaps, public.roadmap_steps, public.shortlist, public.chat_messages
to service_role;

-- reference data: readable by everyone (landing page can preview it)
grant select on public.universities, public.scholarships to anon, authenticated;

-- user data: signed-in users only, rows limited by RLS below
grant select on public.users to authenticated;
grant update (full_name, avatar_url, onboarding_completed) on public.users to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.roadmaps to authenticated;
grant select, insert, update, delete on public.roadmap_steps to authenticated;
grant select, insert, delete on public.shortlist to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.scholarships enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;
alter table public.shortlist enable row level security;
alter table public.chat_messages enable row level security;

-- reference data
create policy "Universities are readable by everyone"
  on public.universities for select
  to anon, authenticated
  using (true);

create policy "Scholarships are readable by everyone"
  on public.scholarships for select
  to anon, authenticated
  using (true);

-- users
create policy "Users can read their own row"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own row"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- profiles
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- roadmaps
create policy "Users can read their own roadmap"
  on public.roadmaps for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own roadmap"
  on public.roadmaps for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own roadmap"
  on public.roadmaps for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own roadmap"
  on public.roadmaps for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- roadmap_steps (composite FK already ties roadmap_id to user_id)
create policy "Users can read their own steps"
  on public.roadmap_steps for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own steps"
  on public.roadmap_steps for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own steps"
  on public.roadmap_steps for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own steps"
  on public.roadmap_steps for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- shortlist
create policy "Users can read their own shortlist"
  on public.shortlist for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add to their own shortlist"
  on public.shortlist for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own shortlist"
  on public.shortlist for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- chat_messages
create policy "Users can read their own messages"
  on public.chat_messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can write their own messages"
  on public.chat_messages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can clear their own messages"
  on public.chat_messages for delete
  to authenticated
  using ((select auth.uid()) = user_id);
-- UniRoute · supabase/migrations/20260917120023_init_schema.sql
