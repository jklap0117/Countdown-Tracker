-- Push reminders, plus three fixes to 0001.
--
-- Applied through the Supabase MCP connection; kept here so the schema stays
-- reproducible from the repo alone.

-- ═══════════════════════════════════════════════════════════════════════════
--  Push subscriptions
--
--  One row per device per person. Permission is granted per browser, not per
--  account, so a person with a phone and a laptop has two rows.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,

  -- Issued by the browser's push service. Unique because re-subscribing the
  -- same device must update the existing row, not accumulate duplicates.
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,

  -- IANA zone, e.g. 'America/New_York'. The job fires at 9 AM wherever the
  -- device actually is, which handles DST and travel without a code change.
  timezone   text not null default 'UTC',

  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push: read own"
  on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push: insert own"
  on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push: update own"
  on public.push_subscriptions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push: delete own"
  on public.push_subscriptions for delete using (user_id = auth.uid());

-- Dedupe. A re-run, a retry, or a second device must never double-send.
alter table public.milestones add column reminded_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════
--  Fixes to 0001
-- ═══════════════════════════════════════════════════════════════════════════

-- Realtime was never actually on: the publication ended up with zero tables,
-- so both phones were silently missing live updates.
alter publication supabase_realtime add table public.milestones;

-- Advisor 0011: a mutable search_path on a trigger function is a privilege
-- escalation path.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Advisor 0028: anon can reach SECURITY DEFINER functions over /rest/v1/rpc.
-- auth.uid() is null for anon so it could only ever return false, but there is
-- no reason for it to be callable at all.
revoke execute on function public.is_partner_of(uuid) from anon;
