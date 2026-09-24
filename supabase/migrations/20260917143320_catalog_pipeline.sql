-- =====================================================================
-- AI catalog pipeline
-- Universities can now be discovered and enriched automatically
-- (Wikidata + Wikimedia Commons + official pages + Gemini) and
-- students can request a university that is missing from the catalog.
-- =====================================================================

alter table public.universities
  add column origin text not null default 'curated' check (origin in ('curated', 'ai')),
  add column status text not null default 'published' check (status in ('published', 'draft')),
  add column wikidata_id text unique,
  -- per-field provenance: { "tuition_usd_per_year": { "kind": "page", "url": "...", "evidence": "..." }, ... }
  add column field_sources jsonb not null default '{}'::jsonb check (jsonb_typeof(field_sources) = 'object'),
  add column enriched_at timestamptz;

-- Drafts (incomplete AI records) stay invisible to the app.
drop policy "Universities are readable by everyone" on public.universities;
create policy "Published universities are readable by everyone"
  on public.universities for select
  to anon, authenticated
  using (status = 'published');

-- ---------------------------------------------------------------------
-- catalog_requests: "add a university I can't find"
-- ---------------------------------------------------------------------

create table public.catalog_requests (
  id bigint generated always as identity primary key,
  user_id uuid references public.users (id) on delete set null,
  query text not null check (char_length(query) between 2 and 120),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'duplicate', 'not_found', 'failed')),
  university_id bigint references public.universities (id) on delete set null,
  message text,
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_requests_user_id_idx on public.catalog_requests (user_id);
create index catalog_requests_university_id_idx on public.catalog_requests (university_id);
create index catalog_requests_open_idx on public.catalog_requests (created_at) where status in ('queued', 'running');

create trigger catalog_requests_set_updated_at
  before update on public.catalog_requests
  for each row execute function private.set_updated_at();

revoke all on public.catalog_requests from anon, authenticated;
grant all on public.catalog_requests to service_role;
grant select, insert on public.catalog_requests to authenticated;

alter table public.catalog_requests enable row level security;

create policy "Users can read their own catalog requests"
  on public.catalog_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users only enqueue; processing (status changes, linking) runs with the service role.
create policy "Users can request a university"
  on public.catalog_requests for insert
  to authenticated
  with check ((select auth.uid()) = user_id and status = 'queued' and university_id is null and attempts = 0);
