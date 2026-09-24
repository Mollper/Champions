-- Three roles: students (default), mentors (after an approved application) and admins.
-- Mentors see the data of their own students and chat with them; admins oversee
-- everything through the server (service role), never through client-side grants.

-- ---------------------------------------------------------------- roles
alter table public.users
  add column role text not null default 'student' check (role in ('student', 'mentor', 'admin'));
-- `role` is deliberately absent from the column-level UPDATE grant: nobody can promote themselves.

create index users_role_idx on public.users (role) where role <> 'student';

-- Helpers for policies. SECURITY DEFINER so they can read the lookup tables regardless of
-- the caller's RLS; kept in the unexposed `private` schema and bound to auth.uid().
grant usage on schema private to authenticated;


-- ---------------------------------------------------------------- mentor applications
create table public.mentor_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  headline text not null check (char_length(headline) between 5 and 160),
  expertise text[] not null default '{}' check (cardinality(expertise) <= 12),
  experience text not null check (char_length(experience) between 30 and 3000),
  contact text check (char_length(contact) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text check (char_length(admin_note) <= 1000),
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- one open application at a time
create unique index mentor_applications_one_pending_idx on public.mentor_applications (user_id) where status = 'pending';
create index mentor_applications_user_id_idx on public.mentor_applications (user_id);
create index mentor_applications_reviewed_by_idx on public.mentor_applications (reviewed_by);

create trigger mentor_applications_set_updated_at
  before update on public.mentor_applications
  for each row execute function private.set_updated_at();

grant select, insert on public.mentor_applications to authenticated;
alter table public.mentor_applications enable row level security;

create policy "Applicants read their own applications"
  on public.mentor_applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Applicants submit pending applications"
  on public.mentor_applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and reviewed_by is null and reviewed_at is null and admin_note is null);

-- ---------------------------------------------------------------- mentor profiles
-- The public card of an approved mentor that students choose from (created on approval).
create table public.mentor_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  headline text not null check (char_length(headline) between 5 and 160),
  bio text not null default '' check (char_length(bio) <= 3000),
  expertise text[] not null default '{}' check (cardinality(expertise) <= 12),
  accepting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger mentor_profiles_set_updated_at
  before update on public.mentor_profiles
  for each row execute function private.set_updated_at();

grant select on public.mentor_profiles to authenticated;
grant update (headline, bio, expertise, accepting) on public.mentor_profiles to authenticated;
alter table public.mentor_profiles enable row level security;

create policy "Signed-in users see mentor cards"
  on public.mentor_profiles for select
  to authenticated
  using (true);

create policy "Mentors edit their own card"
  on public.mentor_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- mentorships
-- A student asks a mentor (pending); the mentor accepts (active) or declines/ends it.
create table public.mentorships (
  mentor_id uuid not null references public.users (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (mentor_id, student_id),
  check (mentor_id <> student_id)
);

-- a student has at most one mentor asked or active at a time
create unique index mentorships_one_open_per_student_idx on public.mentorships (student_id) where status in ('pending', 'active');
create index mentorships_student_id_idx on public.mentorships (student_id);

create trigger mentorships_set_updated_at
  before update on public.mentorships
  for each row execute function private.set_updated_at();

grant select, insert on public.mentorships to authenticated;
grant update (status) on public.mentorships to authenticated;
grant delete on public.mentorships to authenticated;
alter table public.mentorships enable row level security;

create policy "Both sides read their mentorships"
  on public.mentorships for select
  to authenticated
  using ((select auth.uid()) in (mentor_id, student_id));

create policy "Students ask an accepting mentor"
  on public.mentorships for insert
  to authenticated
  with check (
    (select auth.uid()) = student_id
    and status = 'pending'
    and exists (select 1 from public.mentor_profiles mp where mp.user_id = mentor_id and mp.accepting)
  );

create policy "Mentors accept, decline or end; students end"
  on public.mentorships for update
  to authenticated
  using ((select auth.uid()) in (mentor_id, student_id))
  with check (
    ((select auth.uid()) = mentor_id and status in ('active', 'ended'))
    or ((select auth.uid()) = student_id and status = 'ended')
  );

create policy "Students withdraw their request"
  on public.mentorships for delete
  to authenticated
  using ((select auth.uid()) = student_id and status = 'pending');

create or replace function private.is_mentor_of(student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mentorships m
    where m.mentor_id = (select auth.uid()) and m.student_id = student and m.status = 'active'
  );
$$;

-- ---------------------------------------------------------------- mentor chat
create table public.mentor_messages (
  id bigint generated always as identity primary key,
  mentor_id uuid not null,
  student_id uuid not null,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  foreign key (mentor_id, student_id) references public.mentorships (mentor_id, student_id) on delete cascade
);

create index mentor_messages_thread_idx on public.mentor_messages (mentor_id, student_id, created_at);
create index mentor_messages_student_id_idx on public.mentor_messages (student_id);
create index mentor_messages_sender_id_idx on public.mentor_messages (sender_id);

grant select, insert on public.mentor_messages to authenticated;
grant update (read_at) on public.mentor_messages to authenticated;
alter table public.mentor_messages enable row level security;

create policy "Participants read their thread"
  on public.mentor_messages for select
  to authenticated
  using ((select auth.uid()) in (mentor_id, student_id));

create policy "Participants write in an active thread"
  on public.mentor_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and sender_id in (mentor_id, student_id)
    and exists (
      select 1 from public.mentorships m
      where m.mentor_id = mentor_messages.mentor_id and m.student_id = mentor_messages.student_id and m.status = 'active'
    )
  );

create policy "Recipients mark messages read"
  on public.mentor_messages for update
  to authenticated
  using ((select auth.uid()) in (mentor_id, student_id) and (select auth.uid()) <> sender_id)
  with check ((select auth.uid()) in (mentor_id, student_id));

-- live updates in the chat
alter publication supabase_realtime add table public.mentor_messages;

-- ---------------------------------------------------------------- mentors read their students
create policy "Mentors read their students' accounts"
  on public.users for select
  to authenticated
  using (private.is_mentor_of(id));

create policy "Mentors read their students' profiles"
  on public.profiles for select
  to authenticated
  using (private.is_mentor_of(user_id));

create policy "Mentors read their students' roadmaps"
  on public.roadmaps for select
  to authenticated
  using (private.is_mentor_of(user_id));

create policy "Mentors read their students' steps"
  on public.roadmap_steps for select
  to authenticated
  using (private.is_mentor_of(user_id));

create policy "Mentors read their students' shortlist"
  on public.shortlist for select
  to authenticated
  using (private.is_mentor_of(user_id));

create policy "Mentors read their students' favorites"
  on public.favorites for select
  to authenticated
  using (private.is_mentor_of(user_id));

create policy "Mentors read their students' plans"
  on public.plans for select
  to authenticated
  using (private.is_mentor_of(user_id));

-- students see who their mentor is
create policy "Students read their mentor's account"
  on public.users for select
  to authenticated
  using (
    exists (
      select 1 from public.mentorships m
      where m.student_id = (select auth.uid()) and m.mentor_id = users.id and m.status in ('pending', 'active')
    )
  );

revoke execute on function private.is_mentor_of(uuid) from public, anon;
grant execute on function private.is_mentor_of(uuid) to authenticated;
-- UniRoute · supabase/migrations/20260918171607_roles_mentors_chat.sql
