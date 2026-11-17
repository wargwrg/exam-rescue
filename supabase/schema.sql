-- Exam Rescue by Clutch Up: database setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run once.

-- 1. One row per student: their plan data, when their trial started, and how long they've paid for.
create table if not exists public.accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb,
  trial_started_at timestamptz not null default now(),
  paid_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- Students can only see their own row.
drop policy if exists "read own account" on public.accounts;
create policy "read own account" on public.accounts
  for select using (auth.uid() = user_id);

drop policy if exists "create own account" on public.accounts;
create policy "create own account" on public.accounts
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own account" on public.accounts;
create policy "update own account" on public.accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Students may only write their plan data. They can never change trial_started_at
-- or paid_until themselves (only the payment webhook / code redemption can).
revoke insert, update on public.accounts from authenticated, anon;
grant insert (user_id, data) on public.accounts to authenticated;
grant update (data, updated_at) on public.accounts to authenticated;
grant select on public.accounts to authenticated;

-- 2. Access codes (for Etsy sales, schools, giveaways).
create table if not exists public.redeem_codes (
  code text primary key,
  days integer not null default 365,
  note text,
  used_by uuid references auth.users (id),
  used_at timestamptz
);
alter table public.redeem_codes enable row level security;
-- no policies: students can't read the codes table, only redeem through the function below.

create or replace function public.redeem_code(p_code text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_until timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first.';
  end if;

  update redeem_codes
     set used_by = auth.uid(), used_at = now()
   where code = upper(trim(p_code)) and used_by is null
  returning days into v_days;

  if v_days is null then
    raise exception 'That code is not valid or has already been used.';
  end if;

  update accounts
     set paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(days => v_days)
   where user_id = auth.uid()
  returning paid_until into v_until;

  return v_until;
end;
$$;

revoke all on function public.redeem_code(text) from public;
revoke execute on function public.redeem_code(text) from anon;
grant execute on function public.redeem_code(text) to authenticated;

-- Example: create 3 codes (change them!). Each unlocks one student for a year.
-- insert into public.redeem_codes (code, note) values ('ETSY-7Q2K-91', 'Etsy order 123'), ('ETSY-PL4M-22', null), ('SCHOOL-ABC-01', 'pilot');
