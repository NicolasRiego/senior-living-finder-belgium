
create table if not exists public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  code text not null unique,
  email text,
  role_in_org public.org_role not null default 'member',
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_org_invitations_code on public.org_invitations(code);
create index if not exists idx_org_invitations_org on public.org_invitations(org_id);

alter table public.org_invitations enable row level security;

create policy org_invitations_admin_all on public.org_invitations
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy org_invitations_owner_manage on public.org_invitations
  for all to authenticated
  using (exists (select 1 from public.org_members m where m.org_id = org_invitations.org_id and m.user_id = auth.uid() and m.role_in_org in ('owner','manager')))
  with check (exists (select 1 from public.org_members m where m.org_id = org_invitations.org_id and m.user_id = auth.uid() and m.role_in_org in ('owner','manager')));

create or replace function public.create_organization_with_owner(
  _name text, _slug text, _contact_email text, _contact_phone text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare new_org_id uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  insert into public.organizations(name, slug, contact_email, contact_phone)
  values (_name, _slug, _contact_email, _contact_phone)
  returning id into new_org_id;
  insert into public.org_members(org_id, user_id, role_in_org) values (new_org_id, uid, 'owner');
  insert into public.user_roles(user_id, role) values (uid, 'partner_member') on conflict do nothing;
  return new_org_id;
end $$;

create or replace function public.accept_org_invitation(_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare inv public.org_invitations%rowtype; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into inv from public.org_invitations
   where code = _code and used_at is null and expires_at > now() limit 1;
  if not found then raise exception 'invalid_or_expired_code'; end if;
  insert into public.org_members(org_id, user_id, role_in_org)
  values (inv.org_id, uid, inv.role_in_org) on conflict do nothing;
  insert into public.user_roles(user_id, role) values (uid, 'partner_member') on conflict do nothing;
  update public.org_invitations set used_by = uid, used_at = now() where id = inv.id;
  return inv.org_id;
end $$;

create or replace function public.residence_completeness(_residence_id uuid)
returns integer language plpgsql stable security definer set search_path = public
as $$
declare
  r public.residences%rowtype;
  score int := 0;
  unit_count int := 0; pricing_count int := 0; service_count int := 0; photo_count int := 0;
begin
  select * into r from public.residences where id = _residence_id;
  if not found then return 0; end if;
  if r.nom_fr is not null and length(r.nom_fr) > 1 then score := score + 5; end if;
  if r.tagline_fr is not null then score := score + 3; end if;
  if r.description_fr is not null and length(r.description_fr) >= 80 then score := score + 7; end if;
  if r.adresse is not null then score := score + 4; end if;
  if r.code_postal is not null then score := score + 3; end if;
  if r.ville is not null then score := score + 4; end if;
  if r.region is not null then score := score + 4; end if;
  select count(*) into unit_count from public.unit_types where residence_id = _residence_id;
  if unit_count > 0 then score := score + 8; end if;
  if unit_count >= 2 then score := score + 7; end if;
  select count(*) into pricing_count from public.pricing p
    join public.unit_types u on u.id = p.unit_type_id where u.residence_id = _residence_id;
  if pricing_count > 0 then score := score + 15; end if;
  select count(*) into service_count from public.residence_services where residence_id = _residence_id;
  if service_count >= 3 then score := score + 5; end if;
  if service_count >= 8 then score := score + 5; end if;
  if exists (select 1 from public.residence_activities where residence_id = _residence_id) then
    score := score + 5;
  end if;
  select count(*) into photo_count from public.photos where residence_id = _residence_id;
  if photo_count > 0 then score := score + 5; end if;
  if photo_count >= 4 then score := score + 5; end if;
  if exists (select 1 from public.photos where residence_id = _residence_id and category = 'cover') then
    score := score + 5;
  end if;
  if r.contact_email is not null then score := score + 4; end if;
  if r.contact_phone is not null then score := score + 4; end if;
  if r.website is not null then score := score + 2; end if;
  if score > 100 then score := 100; end if;
  return score;
end $$;

create or replace function public.submit_residence(_residence_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); comp int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not public.can_manage_residence(uid, _residence_id) then raise exception 'forbidden'; end if;
  comp := public.residence_completeness(_residence_id);
  if comp < 60 then raise exception 'completeness_too_low: %', comp; end if;
  update public.residences set status = 'pending'
   where id = _residence_id and status in ('draft','rejected');
  insert into public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  values (uid, 'SUBMIT', 'residences', _residence_id, jsonb_build_object('completeness', comp));
end $$;

create or replace function public.approve_residence(_residence_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if not public.is_admin(uid) then raise exception 'forbidden'; end if;
  update public.residences set status = 'published', published_at = now(), rejected_reason = null
   where id = _residence_id;
  insert into public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  values (uid, 'APPROVE', 'residences', _residence_id, '{}'::jsonb);
end $$;

create or replace function public.reject_residence(_residence_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if not public.is_admin(uid) then raise exception 'forbidden'; end if;
  update public.residences set status = 'rejected', rejected_reason = _reason
   where id = _residence_id;
  insert into public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  values (uid, 'REJECT', 'residences', _residence_id, jsonb_build_object('reason', _reason));
end $$;

create policy "residence-photos org write"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'residence-photos'
    and public.storage_residence_id(name) is not null
    and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
  )
  with check (
    bucket_id = 'residence-photos'
    and public.storage_residence_id(name) is not null
    and public.can_manage_residence(auth.uid(), public.storage_residence_id(name))
  );

create policy "residence-photos public read published"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'residence-photos'
    and public.storage_residence_id(name) is not null
    and public.residence_is_published(public.storage_residence_id(name))
  );
