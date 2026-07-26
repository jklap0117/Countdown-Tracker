-- Milestone Tracker — initial schema.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is idempotent enough to read top to bottom once; re-running it will fail
-- on the CREATE TABLEs, which is the intended safety net.

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
--  Pairing
--
--  Exactly who can see whose milestones. Rows are stored in BOTH directions
--  (A→B and B→A) so every visibility check is a plain equality on user_id.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.partners (
  user_id    uuid not null references auth.users on delete cascade,
  partner_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  constraint partners_not_self check (user_id <> partner_id)
);

alter table public.partners enable row level security;

create policy "partners: read links involving you"
  on public.partners for select
  using (user_id = auth.uid() or partner_id = auth.uid());

create policy "partners: link yourself to someone"
  on public.partners for insert
  with check (user_id = auth.uid());

create policy "partners: unlink yourself"
  on public.partners for delete
  using (user_id = auth.uid());

-- SECURITY DEFINER so the milestones policies can consult `partners` without
-- recursing back through its own row-level security.
create or replace function public.is_partner_of(other uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.partners
    where user_id = auth.uid()
      and partner_id = other
  );
$$;

revoke all on function public.is_partner_of(uuid) from public;
grant execute on function public.is_partner_of(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
--  Milestones
-- ═══════════════════════════════════════════════════════════════════════════

create table public.milestones (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,

  title      text not null check (length(btrim(title)) > 0),
  cat        text not null,

  -- 'YYYY-MM-DD' for all-day, 'YYYY-MM-DDTHH:mm' when a time was set.
  -- Deliberately TEXT, not timestamptz: an all-day milestone has no time zone,
  -- and coercing it to one is exactly the off-by-a-day bug the design handoff
  -- warns about. The client parses it as local.
  occurs_at  text not null check (occurs_at ~ '^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$'),
  has_time   boolean not null default false,

  who        text not null check (who in ('me', 'maddie', 'both')),

  notes      text,
  link       text,
  remind     boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_owner_idx on public.milestones (owner_id);
create index milestones_occurs_at_idx on public.milestones (occurs_at);

alter table public.milestones enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
--  THE PRIVACY GUARANTEE
--
--  who = 'me' means "private to whoever wrote it".
--
--  Because this is a SELECT policy, a private row is invisible to the partner
--  in EVERY query — including count(*) and aggregates. The handoff's promise
--  ("private milestones never leave your phone, not even in counts") holds in
--  the database, not merely in the UI.
-- ───────────────────────────────────────────────────────────────────────────
create policy "milestones: read own, plus partner's non-private"
  on public.milestones for select
  using (
    owner_id = auth.uid()
    or (who <> 'me' and public.is_partner_of(owner_id))
  );

create policy "milestones: insert your own"
  on public.milestones for insert
  with check (owner_id = auth.uid());

-- The owner may edit anything of theirs. A partner may edit a shared item, but
-- WITH CHECK pins who = 'both' so they cannot quietly convert a shared
-- milestone into a private one and take it out of the other person's list.
create policy "milestones: update own or shared"
  on public.milestones for update
  using (
    owner_id = auth.uid()
    or (who = 'both' and public.is_partner_of(owner_id))
  )
  with check (
    owner_id = auth.uid()
    or (who = 'both' and public.is_partner_of(owner_id))
  );

create policy "milestones: delete own or shared"
  on public.milestones for delete
  using (
    owner_id = auth.uid()
    or (who = 'both' and public.is_partner_of(owner_id))
  );

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger milestones_touch_updated_at
  before update on public.milestones
  for each row execute function public.touch_updated_at();

-- Realtime. Postgres changes are filtered through the policies above, so a
-- partner never receives an event for a private row.
alter publication supabase_realtime add table public.milestones;
