-- 1. Add qualification fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS for_whom text,
  ADD COLUMN IF NOT EXISTS region_target text,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_residence_status_created
  ON public.leads(residence_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user
  ON public.leads(user_id) WHERE user_id IS NOT NULL;

-- 2. Lead status update RLS policy already covers it, but let's ensure org members can update
-- (existing leads_org_update is sufficient)

-- 3. Submit lead with scoring (callable by anon and authenticated)
CREATE OR REPLACE FUNCTION public.submit_lead(
  _residence_id uuid,
  _contact_name text,
  _contact_email text,
  _contact_phone text,
  _message text,
  _for_whom text,
  _region_target text,
  _budget_range text,
  _budget_min numeric,
  _budget_max numeric,
  _timing text,
  _autonomy_level text,
  _consent boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_id uuid;
  score int := 0;
  budget_pts int := 0;
  timing_pts int := 0;
  comp_pts int := 0;
  res_price_from numeric;
  filled int := 0;
  total int := 8;
BEGIN
  IF _consent IS NOT TRUE THEN RAISE EXCEPTION 'consent_required'; END IF;
  IF _contact_email IS NULL OR length(trim(_contact_email)) = 0 THEN RAISE EXCEPTION 'email_required'; END IF;
  IF _contact_name IS NULL OR length(trim(_contact_name)) = 0 THEN RAISE EXCEPTION 'name_required'; END IF;

  -- Budget scoring (50 pts): if user budget >= residence price_from, full points; partial otherwise
  SELECT MIN(p.estimated_monthly_min) INTO res_price_from
  FROM public.pricing p
  JOIN public.unit_types u ON u.id = p.unit_type_id
  WHERE u.residence_id = _residence_id;

  IF res_price_from IS NULL OR _budget_max IS NULL THEN
    budget_pts := 25; -- unknown -> half points
  ELSIF _budget_max >= res_price_from THEN
    budget_pts := 50;
  ELSIF _budget_max >= res_price_from * 0.85 THEN
    budget_pts := 35;
  ELSIF _budget_max >= res_price_from * 0.70 THEN
    budget_pts := 20;
  ELSE
    budget_pts := 5;
  END IF;

  -- Timing scoring (25 pts)
  timing_pts := CASE lower(coalesce(_timing,''))
    WHEN 'immediate' THEN 25
    WHEN '1_3_months' THEN 22
    WHEN '3_6_months' THEN 16
    WHEN '6_12_months' THEN 10
    WHEN 'later' THEN 5
    ELSE 8
  END;

  -- Completeness scoring (25 pts)
  IF _contact_name IS NOT NULL AND length(trim(_contact_name)) > 1 THEN filled := filled + 1; END IF;
  IF _contact_email IS NOT NULL AND length(trim(_contact_email)) > 3 THEN filled := filled + 1; END IF;
  IF _contact_phone IS NOT NULL AND length(trim(_contact_phone)) > 3 THEN filled := filled + 1; END IF;
  IF _message IS NOT NULL AND length(trim(_message)) > 10 THEN filled := filled + 1; END IF;
  IF _for_whom IS NOT NULL THEN filled := filled + 1; END IF;
  IF _region_target IS NOT NULL THEN filled := filled + 1; END IF;
  IF _autonomy_level IS NOT NULL THEN filled := filled + 1; END IF;
  IF _budget_max IS NOT NULL OR _budget_range IS NOT NULL THEN filled := filled + 1; END IF;
  comp_pts := round(25.0 * filled / total);

  score := LEAST(100, budget_pts + timing_pts + comp_pts);

  INSERT INTO public.leads (
    residence_id, user_id, contact_name, contact_email, contact_phone,
    message, for_whom, region_target, budget_range, budget_min, budget_max,
    timing, autonomy_level, consent_rgpd, score, status
  ) VALUES (
    _residence_id, uid, trim(_contact_name), lower(trim(_contact_email)), _contact_phone,
    _message, _for_whom, _region_target, _budget_range, _budget_min, _budget_max,
    _timing, _autonomy_level, true, score, 'new'
  ) RETURNING id INTO new_id;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'LEAD_SUBMIT', 'leads', new_id,
    jsonb_build_object('residence_id', _residence_id, 'score', score));

  RETURN new_id;
END $$;

GRANT EXECUTE ON FUNCTION public.submit_lead TO anon, authenticated;

-- 4. Log when a partner opens a lead
CREATE OR REPLACE FUNCTION public.log_lead_view(_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT residence_id INTO rid FROM public.leads WHERE id = _lead_id;
  IF rid IS NULL THEN RETURN; END IF;
  IF NOT (public.can_manage_residence(uid, rid) OR public.is_admin(uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'LEAD_VIEW', 'leads', _lead_id, jsonb_build_object('residence_id', rid));
END $$;

GRANT EXECUTE ON FUNCTION public.log_lead_view TO authenticated;

-- 5. Update lead status with audit
CREATE OR REPLACE FUNCTION public.update_lead_status(_lead_id uuid, _status lead_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
  old_status lead_status;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT residence_id, status INTO rid, old_status FROM public.leads WHERE id = _lead_id;
  IF rid IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT (public.can_manage_residence(uid, rid) OR public.is_admin(uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.leads SET status = _status, updated_at = now() WHERE id = _lead_id;
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'LEAD_STATUS', 'leads', _lead_id,
    jsonb_build_object('from', old_status, 'to', _status));
END $$;

GRANT EXECUTE ON FUNCTION public.update_lead_status TO authenticated;

-- 6. Export my data (RGPD)
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = uid),
    'roles', COALESCE((SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id = uid), '[]'::jsonb),
    'leads', COALESCE((SELECT jsonb_agg(to_jsonb(l)) FROM public.leads l WHERE l.user_id = uid), '[]'::jsonb),
    'favorites', COALESCE((SELECT jsonb_agg(to_jsonb(f)) FROM public.favorites f WHERE f.user_id = uid), '[]'::jsonb)
  ) INTO result;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'GDPR_EXPORT', 'profiles', uid, '{}'::jsonb);
  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.export_my_data TO authenticated;

-- 7. Anonymize my account (RGPD account deletion, keeps lead history anonymized)
CREATE OR REPLACE FUNCTION public.anonymize_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Anonymize leads created by this user (keep for partner history)
  UPDATE public.leads
    SET contact_name = 'Utilisateur supprimé',
        contact_email = concat('anon-', id::text, '@deleted.local'),
        contact_phone = NULL,
        message = NULL,
        user_id = NULL,
        anonymized_at = now()
    WHERE user_id = uid;

  -- Wipe favorites
  DELETE FROM public.favorites WHERE user_id = uid;

  -- Wipe profile + roles
  DELETE FROM public.user_roles WHERE user_id = uid;
  DELETE FROM public.profiles WHERE user_id = uid;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'GDPR_DELETE', 'profiles', uid, '{}'::jsonb);
END $$;

GRANT EXECUTE ON FUNCTION public.anonymize_my_account TO authenticated;

-- 8. Admin: purge leads older than 24 months
CREATE OR REPLACE FUNCTION public.purge_old_leads(_months int DEFAULT 24)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  affected int;
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  WITH upd AS (
    UPDATE public.leads
       SET contact_name = 'Anonymisé',
           contact_email = concat('purged-', id::text, '@deleted.local'),
           contact_phone = NULL,
           message = NULL,
           user_id = NULL,
           anonymized_at = now()
     WHERE created_at < now() - make_interval(months => _months)
       AND anonymized_at IS NULL
     RETURNING 1
  )
  SELECT count(*) INTO affected FROM upd;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'LEADS_PURGE', 'leads', NULL, jsonb_build_object('months', _months, 'count', affected));
  RETURN affected;
END $$;

GRANT EXECUTE ON FUNCTION public.purge_old_leads TO authenticated;