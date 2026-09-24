-- One SELECT policy per table instead of an owner policy plus a mentor policy:
-- Postgres evaluates every permissive policy for each row (advisor: multiple_permissive_policies).

-- users: yourself, your students (as a mentor), your mentor (as a student)
drop policy "Users can read their own row" on public.users;
drop policy "Mentors read their students' accounts" on public.users;
drop policy "Students read their mentor's account" on public.users;
create policy "Users read themselves, their students and their mentor"
  on public.users for select
  to authenticated
  using (
    (select auth.uid()) = id
    or private.is_mentor_of(id)
    or exists (
      select 1 from public.mentorships m
      where m.student_id = (select auth.uid()) and m.mentor_id = users.id and m.status in ('pending', 'active')
    )
  );

drop policy "Users can read their own profile" on public.profiles;
drop policy "Mentors read their students' profiles" on public.profiles;
create policy "Students and their mentor read the profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

drop policy "Users can read their own roadmap" on public.roadmaps;
drop policy "Mentors read their students' roadmaps" on public.roadmaps;
create policy "Students and their mentor read the roadmap"
  on public.roadmaps for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

drop policy "Users can read their own steps" on public.roadmap_steps;
drop policy "Mentors read their students' steps" on public.roadmap_steps;
create policy "Students and their mentor read roadmap steps"
  on public.roadmap_steps for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

drop policy "Users can read their own shortlist" on public.shortlist;
drop policy "Mentors read their students' shortlist" on public.shortlist;
create policy "Students and their mentor read the shortlist"
  on public.shortlist for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

drop policy "Students read their own favorites" on public.favorites;
drop policy "Mentors read their students' favorites" on public.favorites;
create policy "Students and their mentor read favorites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));

drop policy "Students read their own plans" on public.plans;
drop policy "Mentors read their students' plans" on public.plans;
create policy "Students and their mentor read plans"
  on public.plans for select
  to authenticated
  using ((select auth.uid()) = user_id or private.is_mentor_of(user_id));
-- UniRoute · supabase/migrations/20260918171741_merge_owner_and_mentor_read_policies.sql
