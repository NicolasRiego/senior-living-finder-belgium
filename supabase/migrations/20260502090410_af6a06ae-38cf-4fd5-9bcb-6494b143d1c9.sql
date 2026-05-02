-- Recreate price summary view as security_invoker (so RLS of caller applies)
drop view if exists public.v_residence_price_summary;
create view public.v_residence_price_summary
with (security_invoker = true) as
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

-- Fix search_path on remaining functions
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.storage_residence_id(_name text)
returns uuid language sql stable set search_path = public as $$
  select case
    when split_part(_name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
      then split_part(_name, '/', 1)::uuid
    else null
  end
$$;

-- Lock down SECURITY DEFINER helpers: revoke from public/anon, grant to authenticated only.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.is_org_member(uuid, uuid) from public, anon;
revoke execute on function public.user_org_ids(uuid) from public, anon;
revoke execute on function public.can_manage_residence(uuid, uuid) from public, anon;
revoke execute on function public.unit_type_residence(uuid) from public, anon;
revoke execute on function public.snapshot_residence(uuid, text, uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon;
revoke execute on function public.versionize_change() from public, anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_org_member(uuid, uuid) to authenticated;
grant execute on function public.user_org_ids(uuid) to authenticated;
grant execute on function public.can_manage_residence(uuid, uuid) to authenticated;
grant execute on function public.unit_type_residence(uuid) to authenticated;

-- residence_is_published is required by RLS evaluated under the anon role too,
-- so it must remain executable by anon (it only checks publication status — no leak).
-- (No revoke needed — default grants are kept.)
