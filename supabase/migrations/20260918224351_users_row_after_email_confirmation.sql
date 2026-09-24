-- =====================================================================
-- An account exists in the app only after its email is confirmed.
--
-- Until now public.users got a row the moment auth.users did — so an address nobody
-- controls (a typo, a made-up one) still showed up as a registered user. The row is now
-- created when the email is confirmed: on insert for accounts that arrive confirmed
-- ("Confirm email" off, or created by an admin), and on the update that confirms it
-- (the code or the link from the letter). Unconfirmed sign-ups stay invisible to the app
-- and are removed by the daily cleanup cron.
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null)
  execute function private.handle_new_user();

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function private.handle_new_user();
