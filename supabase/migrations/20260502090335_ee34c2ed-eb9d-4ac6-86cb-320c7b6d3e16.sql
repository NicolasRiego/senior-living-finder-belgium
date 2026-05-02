-- =============================================================
-- ENUMS
-- =============================================================
create type public.app_role as enum ('public', 'caregiver', 'partner_member', 'admin');
create type public.org_role as enum ('owner', 'manager', 'member');
create type public.publication_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');
create type public.establishment_type as enum ('residence_services', 'seigneurie', 'maison_repos', 'maison_repos_soins');
create type public.occupation_mode as enum ('rent', 'buy', 'rent_or_buy');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'visit_scheduled', 'visit_done', 'won', 'lost');
create type public.photo_category as enum ('exterior', 'common_area', 'apartment', 'dining', 'garden', 'medical', 'activity', 'other');

-- =============================================================
-- HELPERS
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =============================================================
-- PROFILES
-- =============================================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'fr' check (language in ('fr', 'nl')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'caregiver')
  on conflict do nothing;
  return new;
end $$;

-- =============================================================
-- USER_ROLES (separate table — never on profiles)
-- =============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin')
$$;

-- Trigger after auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ORGANIZATIONS & MEMBERS
-- =============================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  vat_number text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;
create trigger trg_org_updated before update on public.organizations
for each row execute function public.set_updated_at();

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_in_org org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
alter table public.org_members enable row level security;
create index idx_org_members_user on public.org_members(user_id);
create index idx_org_members_org on public.org_members(org_id);

create or replace function public.is_org_member(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where user_id = _user_id and org_id = _org_id
  )
$$;

create or replace function public.user_org_ids(_user_id uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from public.org_members where user_id = _user_id
$$;

-- =============================================================
-- RESIDENCES (multi-tenant, multilingual)
-- =============================================================
create table public.residences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  slug text unique not null,
  status publication_status not null default 'draft',
  type_etablissement establishment_type not null,

  nom_fr text not null,
  nom_nl text,
  tagline_fr text,
  tagline_nl text,
  description_fr text,
  description_nl text,

  adresse text,
  code_postal text,
  ville text,
  province text,
  region text,
  pays text not null default 'BE',
  latitude numeric(9,6),
  longitude numeric(9,6),

  -- Proximity info as structured JSON: { transit:[], shops:[], healthcare:[] ... }
  proximity jsonb not null default '{}'::jsonb,

  capacity int,
  contact_email text,
  contact_phone text,
  website text,

  rejected_reason text,
  published_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.residences enable row level security;
create trigger trg_residences_updated before update on public.residences
for each row execute function public.set_updated_at();

create index idx_residences_org on public.residences(org_id);
create index idx_residences_status on public.residences(status);
create index idx_residences_region on public.residences(region);
create index idx_residences_province on public.residences(province);
create index idx_residences_ville on public.residences(ville);
create index idx_residences_type on public.residences(type_etablissement);
create index idx_residences_published on public.residences(status) where status = 'published';

create or replace function public.can_manage_residence(_user_id uuid, _residence_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(_user_id)
      or exists (
        select 1
        from public.residences r
        join public.org_members m on m.org_id = r.org_id
        where r.id = _residence_id and m.user_id = _user_id
      )
$$;

-- =============================================================
-- UNIT TYPES
-- =============================================================
create table public.unit_types (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  type text not null,
  surface_min numeric(6,2),
  surface_max numeric(6,2),
  count_total int not null default 0,
  available_now boolean not null default false,
  available_count int not null default 0,
  waiting_list boolean not null default false,
  waiting_delay_days int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.unit_types enable row level security;
create index idx_unit_types_residence on public.unit_types(residence_id);
create trigger trg_unit_types_updated before update on public.unit_types
for each row execute function public.set_updated_at();

-- =============================================================
-- PRICING
-- =============================================================
create table public.pricing (
  id uuid primary key default gen_random_uuid(),
  unit_type_id uuid not null references public.unit_types(id) on delete cascade,
  occupation_mode occupation_mode not null,
  rent_min numeric(10,2),
  rent_max numeric(10,2),
  buy_min numeric(12,2),
  buy_max numeric(12,2),
  fixed_charges numeric(10,2),
  mandatory_pack numeric(10,2),
  common_options jsonb not null default '[]'::jsonb,
  estimated_monthly_min numeric(10,2)
    generated always as (
      coalesce(rent_min, 0) + coalesce(fixed_charges, 0) + coalesce(mandatory_pack, 0)
    ) stored,
  estimated_monthly_max numeric(10,2)
    generated always as (
      coalesce(rent_max, rent_min, 0) + coalesce(fixed_charges, 0) + coalesce(mandatory_pack, 0)
    ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pricing enable row level security;
create index idx_pricing_unit on public.pricing(unit_type_id);
create index idx_pricing_min on public.pricing(estimated_monthly_min);
create trigger trg_pricing_updated before update on public.pricing
for each row execute function public.set_updated_at();

-- =============================================================
-- SERVICES CATALOG
-- =============================================================
create table public.services_catalog (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label_fr text not null,
  label_nl text,
  category text,
  icon text,
  created_at timestamptz not null default now()
);
alter table public.services_catalog enable row level security;

create table public.residence_services (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  service_id uuid not null references public.services_catalog(id) on delete restrict,
  included boolean not null default false,
  optional boolean not null default false,
  price numeric(10,2),
  comment_fr text,
  comment_nl text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (residence_id, service_id)
);
alter table public.residence_services enable row level security;
create index idx_residence_services_residence on public.residence_services(residence_id);
create trigger trg_residence_services_updated before update on public.residence_services
for each row execute function public.set_updated_at();

-- =============================================================
-- ACTIVITIES CATALOG
-- =============================================================
create table public.activities_catalog (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label_fr text not null,
  label_nl text,
  category text,
  icon text,
  created_at timestamptz not null default now()
);
alter table public.activities_catalog enable row level security;

create table public.residence_activities (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  activity_id uuid not null references public.activities_catalog(id) on delete restrict,
  frequency text,
  managed_by text,
  created_at timestamptz not null default now(),
  unique (residence_id, activity_id)
);
alter table public.residence_activities enable row level security;
create index idx_residence_activities_residence on public.residence_activities(residence_id);

-- =============================================================
-- PHOTOS
-- =============================================================
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  storage_path text not null,
  category photo_category not null default 'other',
  title text,
  alt_text text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;
create index idx_photos_residence on public.photos(residence_id, display_order);

-- =============================================================
-- LEADS
-- =============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  timing text,
  autonomy_level text,
  message text,
  consent_rgpd boolean not null default false,
  score int not null default 0,
  status lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create index idx_leads_residence on public.leads(residence_id);
create index idx_leads_user on public.leads(user_id);
create index idx_leads_status on public.leads(status);
create trigger trg_leads_updated before update on public.leads
for each row execute function public.set_updated_at();

-- =============================================================
-- ADMIN NOTES
-- =============================================================
create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.admin_notes enable row level security;
create index idx_admin_notes_residence on public.admin_notes(residence_id);

-- =============================================================
-- VERSIONING
-- =============================================================
create table public.residence_versions (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  version_number int not null,
  snapshot_json jsonb not null,
  created_by uuid references auth.users(id),
  reason text,
  created_at timestamptz not null default now(),
  unique (residence_id, version_number)
);
alter table public.residence_versions enable row level security;
create index idx_residence_versions_residence on public.residence_versions(residence_id, version_number desc);

-- =============================================================
-- AUDIT LOG
-- =============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index idx_audit_entity on public.audit_log(entity, entity_id);
create index idx_audit_actor on public.audit_log(actor_id);
create index idx_audit_created on public.audit_log(created_at desc);

-- =============================================================
-- VERSION + AUDIT TRIGGER
-- =============================================================
create or replace function public.snapshot_residence(_residence_id uuid, _reason text, _actor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  next_no int;
  snap jsonb;
begin
  select coalesce(max(version_number), 0) + 1 into next_no
  from public.residence_versions where residence_id = _residence_id;

  select to_jsonb(r) || jsonb_build_object(
    'unit_types', coalesce((select jsonb_agg(to_jsonb(u)) from public.unit_types u where u.residence_id = _residence_id), '[]'::jsonb),
    'pricing',    coalesce((select jsonb_agg(to_jsonb(p)) from public.pricing p
                              join public.unit_types u on u.id = p.unit_type_id
                              where u.residence_id = _residence_id), '[]'::jsonb),
    'services',   coalesce((select jsonb_agg(to_jsonb(s)) from public.residence_services s where s.residence_id = _residence_id), '[]'::jsonb),
    'photos',     coalesce((select jsonb_agg(to_jsonb(ph)) from public.photos ph where ph.residence_id = _residence_id), '[]'::jsonb)
  ) into snap
  from public.residences r where r.id = _residence_id;

  insert into public.residence_versions (residence_id, version_number, snapshot_json, created_by, reason)
  values (_residence_id, next_no, snap, _actor, _reason);
end $$;

create or replace function public.versionize_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid uuid;
  actor uuid := auth.uid();
  ent text := tg_table_name;
  reason text;
begin
  if tg_table_name = 'residences' then
    rid := coalesce(new.id, old.id);
  elsif tg_table_name = 'pricing' then
    select u.residence_id into rid
    from public.unit_types u
    where u.id = coalesce(new.unit_type_id, old.unit_type_id);
  else
    rid := coalesce(new.residence_id, old.residence_id);
  end if;

  reason := tg_op || ' on ' || ent;

  if rid is not null then
    perform public.snapshot_residence(rid, reason, actor);
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata_json)
  values (
    actor,
    tg_op,
    ent,
    case when tg_op = 'DELETE' then old.id else new.id end,
    jsonb_build_object('residence_id', rid)
  );

  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger trg_version_residences
  after insert or update or delete on public.residences
  for each row execute function public.versionize_change();

create trigger trg_version_unit_types
  after insert or update or delete on public.unit_types
  for each row execute function public.versionize_change();

create trigger trg_version_pricing
  after insert or update or delete on public.pricing
  for each row execute function public.versionize_change();

create trigger trg_version_residence_services
  after insert or update or delete on public.residence_services
  for each row execute function public.versionize_change();

create trigger trg_version_photos
  after insert or update or delete on public.photos
  for each row execute function public.versionize_change();

-- =============================================================
-- VIEW : residence price summary (for sorting / filtering)
-- =============================================================
create or replace view public.v_residence_price_summary as
select
  r.id as residence_id,
  r.org_id,
  r.status,
  min(p.estimated_monthly_min) as price_min,
  max(p.estimated_monthly_max) as price_max
from public.residences r
left join public.unit_types u on u.residence_id = r.id
left join public.pricing p on p.unit_type_id = u.id
group by r.id, r.org_id, r.status;

-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================

-- profiles: each user sees/edits their own; admins see all
create policy "profiles_self_select" on public.profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

-- user_roles: a user reads their own roles, admins manage all
create policy "user_roles_self_read" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "user_roles_admin_all" on public.user_roles
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- organizations: members read; admins manage
create policy "orgs_member_read" on public.organizations
  for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_org_member(auth.uid(), id));
create policy "orgs_admin_write" on public.organizations
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- org_members: visible to fellow members & admins
create policy "org_members_read" on public.org_members
  for select to authenticated
  using (public.is_admin(auth.uid()) or public.is_org_member(auth.uid(), org_id));
create policy "org_members_admin_write" on public.org_members
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- residences:
--   public + anon: only published
--   org members: their org's residences
--   admins: all
create policy "residences_public_published" on public.residences
  for select to anon, authenticated using (status = 'published');
create policy "residences_org_read" on public.residences
  for select to authenticated using (public.is_org_member(auth.uid(), org_id));
create policy "residences_admin_read" on public.residences
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "residences_org_insert" on public.residences
  for insert to authenticated
  with check (public.is_org_member(auth.uid(), org_id) or public.is_admin(auth.uid()));
create policy "residences_org_update" on public.residences
  for update to authenticated
  using (public.is_org_member(auth.uid(), org_id) or public.is_admin(auth.uid()))
  with check (public.is_org_member(auth.uid(), org_id) or public.is_admin(auth.uid()));
create policy "residences_admin_delete" on public.residences
  for delete to authenticated using (public.is_admin(auth.uid()));

-- Generic helper: check residence is published
create or replace function public.residence_is_published(_residence_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.residences where id = _residence_id and status = 'published')
$$;

-- unit_types
create policy "unit_types_public_read_published" on public.unit_types
  for select to anon, authenticated using (public.residence_is_published(residence_id));
create policy "unit_types_manage" on public.unit_types
  for all to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id))
  with check (public.can_manage_residence(auth.uid(), residence_id));

-- pricing (via unit_type → residence)
create or replace function public.unit_type_residence(_unit_type_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select residence_id from public.unit_types where id = _unit_type_id
$$;

create policy "pricing_public_read_published" on public.pricing
  for select to anon, authenticated
  using (public.residence_is_published(public.unit_type_residence(unit_type_id)));
create policy "pricing_manage" on public.pricing
  for all to authenticated
  using (public.can_manage_residence(auth.uid(), public.unit_type_residence(unit_type_id)))
  with check (public.can_manage_residence(auth.uid(), public.unit_type_residence(unit_type_id)));

-- catalogs: public read, admin write
create policy "services_catalog_read" on public.services_catalog
  for select to anon, authenticated using (true);
create policy "services_catalog_admin_write" on public.services_catalog
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "activities_catalog_read" on public.activities_catalog
  for select to anon, authenticated using (true);
create policy "activities_catalog_admin_write" on public.activities_catalog
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- residence_services
create policy "residence_services_public_read" on public.residence_services
  for select to anon, authenticated using (public.residence_is_published(residence_id));
create policy "residence_services_manage" on public.residence_services
  for all to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id))
  with check (public.can_manage_residence(auth.uid(), residence_id));

-- residence_activities
create policy "residence_activities_public_read" on public.residence_activities
  for select to anon, authenticated using (public.residence_is_published(residence_id));
create policy "residence_activities_manage" on public.residence_activities
  for all to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id))
  with check (public.can_manage_residence(auth.uid(), residence_id));

-- photos
create policy "photos_public_read" on public.photos
  for select to anon, authenticated using (public.residence_is_published(residence_id));
create policy "photos_manage" on public.photos
  for all to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id))
  with check (public.can_manage_residence(auth.uid(), residence_id));

-- leads
--   - public/caregivers can create a lead (anon allowed for contact form)
--   - the lead author sees their own
--   - the residence's org sees its leads
--   - admin sees all
create policy "leads_anon_create" on public.leads
  for insert to anon, authenticated
  with check (consent_rgpd = true);
create policy "leads_author_read" on public.leads
  for select to authenticated using (user_id = auth.uid());
create policy "leads_org_read" on public.leads
  for select to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id));
create policy "leads_org_update" on public.leads
  for update to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id))
  with check (public.can_manage_residence(auth.uid(), residence_id));
create policy "leads_admin_delete" on public.leads
  for delete to authenticated using (public.is_admin(auth.uid()));

-- admin_notes: admins only
create policy "admin_notes_admin_all" on public.admin_notes
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- residence_versions: org members read their own, admin all
create policy "residence_versions_read" on public.residence_versions
  for select to authenticated
  using (public.can_manage_residence(auth.uid(), residence_id));

-- audit_log: admins only
create policy "audit_log_admin_read" on public.audit_log
  for select to authenticated using (public.is_admin(auth.uid()));

-- =============================================================
-- STORAGE BUCKET : residence-photos (private)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('residence-photos', 'residence-photos', false)
on conflict (id) do nothing;

-- Helper: residence_id encoded as first folder of object name
create or replace function public.storage_residence_id(_name text)
returns uuid language sql stable as $$
  select case
    when split_part(_name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
      then split_part(_name, '/', 1)::uuid
    else null
  end
$$;

create policy "photos_bucket_public_read_published"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'residence-photos'
  and public.residence_is_published(public.storage_residence_id(name))
);

create policy "photos_bucket_org_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'residence-photos'
  and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
);

create policy "photos_bucket_org_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'residence-photos'
  and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
);

create policy "photos_bucket_org_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'residence-photos'
  and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
);

create policy "photos_bucket_org_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'residence-photos'
  and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
);
