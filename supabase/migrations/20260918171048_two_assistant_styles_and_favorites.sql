-- The assistant keeps two tones: friendly and strict. Favorites: universities a
-- student saves regardless of whether they match the profile.

-- ---------------------------------------------------------------- assistant styles
-- Existing choices move to the nearest remaining tone. The CHECK keeps accepting the
-- old values until every deployed version writes only the new ones.
update public.profiles set assistant_style = 'friendly' where assistant_style = 'mentor';
update public.profiles set assistant_style = 'strict' where assistant_style = 'concise';

-- ---------------------------------------------------------------- favorites
create table public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  university_id bigint not null references public.universities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, university_id)
);

-- the primary key covers user_id; the university FK needs its own index
create index favorites_university_id_idx on public.favorites (university_id);

grant select, insert, delete on public.favorites to authenticated;
alter table public.favorites enable row level security;

create policy "Students read their own favorites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students add their own favorites"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students remove their own favorites"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);
-- UniRoute · supabase/migrations/20260918171048_two_assistant_styles_and_favorites.sql
