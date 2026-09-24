-- Bump profiles.version only when answers that affect matching change.
-- Saving an unchanged questionnaire or switching the assistant's tone must not
-- rebuild recommendations and the roadmap.
create or replace function private.bump_profile_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ignored constant text[] := array['version', 'updated_at', 'created_at', 'assistant_style'];
begin
  if (to_jsonb(new) - ignored) is distinct from (to_jsonb(old) - ignored) then
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end;
$$;
