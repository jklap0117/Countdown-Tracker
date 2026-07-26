-- Replaces milestones.reminded_at from 0002.
--
-- A single timestamp on the milestone dedupes per MILESTONE, which means the
-- first person's 9 AM would silence the second person's. That breaks as soon
-- as the two of you are in different timezones — and this app is largely about
-- trips. Dedupe belongs per recipient.

create table public.reminder_log (
  milestone_id uuid not null references public.milestones on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  sent_at      timestamptz not null default now(),
  primary key (milestone_id, user_id)
);

alter table public.reminder_log enable row level security;

-- Readable by the person it concerns. Writes are service_role only, which is
-- what the absence of an insert policy means.
create policy "reminder_log: read own"
  on public.reminder_log for select using (user_id = auth.uid());

alter table public.milestones drop column reminded_at;

-- ═══════════════════════════════════════════════════════════════════════════
--  Secrets
--
--  The VAPID keypair and the cron shared secret live in Supabase Vault, not in
--  function env vars, so they never leave the database and never appear in the
--  repo. This function is the only door to them and only service_role has it.
--
--  Values are seeded out of band with vault.create_secret(...), under the names
--  read below.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_reminder_config()
returns table (vapid_public text, vapid_private text, vapid_subject text, cron_secret text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public_key'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private_key'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_subject'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret');
$$;

revoke all on function public.get_reminder_config() from public;
revoke all on function public.get_reminder_config() from anon;
revoke all on function public.get_reminder_config() from authenticated;
grant execute on function public.get_reminder_config() to service_role;
