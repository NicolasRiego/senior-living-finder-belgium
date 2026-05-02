-- 1. account_type sur profiles
alter table public.profiles
  add column if not exists account_type text not null default 'family'
  check (account_type in ('family','partner'));

-- 2. Table favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  residence_id uuid not null references public.residences(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, residence_id)
);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists favorites_residence_idx on public.favorites(residence_id);

alter table public.favorites enable row level security;

create policy favorites_self_all on public.favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy favorites_org_read on public.favorites
  for select to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id));

-- 3. Table residence_events (analytics)
create table if not exists public.residence_events (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  event_type text not null check (event_type in ('view','click_phone','click_email','click_website','click_contact')),
  user_id uuid,
  session_id text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);
create index if not exists residence_events_res_date_idx on public.residence_events(residence_id, created_at desc);
create index if not exists residence_events_type_idx on public.residence_events(event_type);

alter table public.residence_events enable row level security;

-- Anyone (incl. anon) can insert an event for a published residence
create policy residence_events_public_insert on public.residence_events
  for insert to anon, authenticated
  with check (public.residence_is_published(residence_id));

-- Only org members / admins can read
create policy residence_events_org_read on public.residence_events
  for select to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id));

-- 4. Vue agrégée 30 jours
create or replace view public.residence_stats_30d
with (security_invoker = true) as
select
  r.id as residence_id,
  coalesce(sum((e.event_type = 'view')::int), 0)            as views_30d,
  coalesce(sum((e.event_type = 'click_phone')::int), 0)     as clicks_phone_30d,
  coalesce(sum((e.event_type = 'click_email')::int), 0)     as clicks_email_30d,
  coalesce(sum((e.event_type = 'click_website')::int), 0)   as clicks_website_30d,
  coalesce(sum((e.event_type = 'click_contact')::int), 0)   as clicks_contact_30d,
  (select count(*) from public.leads l
     where l.residence_id = r.id and l.created_at > now() - interval '30 days') as leads_30d,
  (select count(*) from public.favorites f where f.residence_id = r.id) as favorites_total
from public.residences r
left join public.residence_events e
  on e.residence_id = r.id and e.created_at > now() - interval '30 days'
group by r.id;

-- 5. Mise à jour de handle_new_user pour respecter account_type fourni au signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acct text := coalesce(new.raw_user_meta_data->>'account_type', 'family');
begin
  if acct not in ('family','partner') then acct := 'family'; end if;

  insert into public.profiles (user_id, display_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    acct
  )
  on conflict (user_id) do update set account_type = excluded.account_type;

  insert into public.user_roles (user_id, role)
  values (new.id, case when acct = 'partner' then 'partner_member'::app_role else 'caregiver'::app_role end)
  on conflict do nothing;

  return new;
end $$;

-- Make sure trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();