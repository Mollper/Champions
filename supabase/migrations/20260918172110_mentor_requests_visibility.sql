-- A mentor sees who is asking before accepting, and a student can ask the same
-- mentor again after an ended mentorship (the row and its chat history are reused).

create or replace function private.is_asked_by(student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mentorships m
    where m.mentor_id = (select auth.uid()) and m.student_id = student and m.status in ('pending', 'active')
  );
$$;

revoke execute on function private.is_asked_by(uuid) from public, anon;
grant execute on function private.is_asked_by(uuid) to authenticated;

drop policy "Users read themselves, their students and their mentor" on public.users;
create policy "Users read themselves, their students and their mentor"
  on public.users for select
  to authenticated
  using (
    (select auth.uid()) = id
    or private.is_asked_by(id)
    or exists (
      select 1 from public.mentorships m
      where m.student_id = (select auth.uid()) and m.mentor_id = users.id and m.status in ('pending', 'active')
    )
  );

drop policy "Mentors accept, decline or end; students end" on public.mentorships;
create policy "Mentors accept, decline or end; students end or ask again"
  on public.mentorships for update
  to authenticated
  using ((select auth.uid()) in (mentor_id, student_id))
  with check (
    ((select auth.uid()) = mentor_id and status in ('active', 'ended'))
    or (
      (select auth.uid()) = student_id
      and (
        status = 'ended'
        or (status = 'pending' and exists (select 1 from public.mentor_profiles mp where mp.user_id = mentor_id and mp.accepting))
      )
    )
  );
