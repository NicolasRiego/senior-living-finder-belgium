CREATE OR REPLACE FUNCTION public.snapshot_residence(_residence_id uuid, _reason text, _actor uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  next_no int;
  snap jsonb;
begin
  -- Serialize concurrent snapshots for the same residence to avoid duplicate version_number
  perform pg_advisory_xact_lock(hashtextextended(_residence_id::text, 0));

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
  values (_residence_id, next_no, snap, _actor, _reason)
  on conflict (residence_id, version_number) do nothing;
end $function$;