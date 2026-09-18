-- =====================================================================
-- Profile photos and essay drafts with AI reviews
-- =====================================================================

-- ---------------------------------------------------------------- avatars
-- Public bucket: photos are shown to mentors and in chats by URL. Each user writes only
-- to the folder named after their id; nobody can list other people's folders.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their own avatar files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------- essays
create table public.essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null check (kind in ('motivation_letter', 'personal_statement')),
  title text not null default '' check (char_length(title) <= 200),
  -- the university / programme a motivation letter is addressed to
  target text check (char_length(target) <= 300),
  -- the question being answered, e.g. a Common App prompt
  prompt text check (char_length(prompt) <= 1000),
  content text not null default '' check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index essays_user_id_updated_idx on public.essays (user_id, updated_at desc);

create trigger essays_set_updated_at
  before update on public.essays
  for each row execute function private.set_updated_at();

-- Each AI review is kept, so a student sees how the score moves from draft to draft.
create table public.essay_reviews (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  word_count integer not null default 0,
  review jsonb not null,
  model text,
  locale text,
  created_at timestamptz not null default now()
);

create index essay_reviews_essay_id_idx on public.essay_reviews (essay_id, created_at desc);
create index essay_reviews_user_id_created_idx on public.essay_reviews (user_id, created_at desc);

alter table public.essays enable row level security;
alter table public.essay_reviews enable row level security;

grant select, insert, update, delete on public.essays to authenticated;
grant select, insert on public.essay_reviews to authenticated;

-- Owners manage their drafts; an active mentor reads them to give feedback.
create policy "Owners and their mentors read essays"
  on public.essays for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

create policy "Owners add essays"
  on public.essays for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners edit essays"
  on public.essays for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners delete essays"
  on public.essays for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners and their mentors read essay reviews"
  on public.essay_reviews for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

create policy "Owners add reviews of their own essays"
  on public.essay_reviews for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.essays e where e.id = essay_id and e.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------- age
-- Age is 15–150. NOT VALID keeps the few older rows readable; the app asks those
-- students to correct the value the next time they save the questionnaire.
alter table public.profiles drop constraint if exists profiles_age_check;
alter table public.profiles add constraint profiles_age_check check (age between 15 and 150) not valid;
