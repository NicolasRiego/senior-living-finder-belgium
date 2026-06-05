
-- 1. New enum lead_type
DO $$ BEGIN
  CREATE TYPE public.lead_type AS ENUM ('visite', 'brochure', 'rappel', 'info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend lead_status with new commercial statuses
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'pris_en_charge';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'visite_planifiee';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'converti';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'perdu';

-- 3. New columns on leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS type public.lead_type NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS firstname text,
  ADD COLUMN IF NOT EXISTS lastname text,
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS source_page text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz;

-- 4. Trigger: set first_response_at when leaving 'new'
CREATE OR REPLACE FUNCTION public.leads_set_first_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND OLD.status = 'new'
     AND NEW.first_response_at IS NULL THEN
    NEW.first_response_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS leads_first_response_trg ON public.leads;
CREATE TRIGGER leads_first_response_trg
  BEFORE UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_set_first_response();

-- 5. Additional RLS policy: assigned user can read their leads
DROP POLICY IF EXISTS leads_assigned_read ON public.leads;
CREATE POLICY leads_assigned_read ON public.leads
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- 6. Update submit_lead to accept new fields (additive, backward-compatible signature)
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
  _consent boolean,
  _type public.lead_type DEFAULT 'info',
  _firstname text DEFAULT NULL,
  _lastname text DEFAULT NULL,
  _preferred_date date DEFAULT NULL,
  _preferred_time text DEFAULT NULL,
  _source_page text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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

  SELECT MIN(p.estimated_monthly_min) INTO res_price_from
  FROM public.pricing p
  JOIN public.unit_types u ON u.id = p.unit_type_id
  WHERE u.residence_id = _residence_id;

  IF res_price_from IS NULL OR _budget_max IS NULL THEN budget_pts := 25;
  ELSIF _budget_max >= res_price_from THEN budget_pts := 50;
  ELSIF _budget_max >= res_price_from * 0.85 THEN budget_pts := 30;
  ELSE budget_pts := 10; END IF;

  timing_pts := CASE _timing
    WHEN 'immediate' THEN 30
    WHEN '1_3_months' THEN 22
    WHEN '3_6_months' THEN 15
    WHEN '6_12_months' THEN 8
    ELSE 4 END;

  IF _for_whom IS NOT NULL AND length(_for_whom) > 0 THEN filled := filled + 1; END IF;
  IF _region_target IS NOT NULL AND length(_region_target) > 0 THEN filled := filled + 1; END IF;
  IF _budget_range IS NOT NULL AND length(_budget_range) > 0 THEN filled := filled + 1; END IF;
  IF _budget_max IS NOT NULL THEN filled := filled + 1; END IF;
  IF _timing IS NOT NULL AND length(_timing) > 0 THEN filled := filled + 1; END IF;
  IF _autonomy_level IS NOT NULL AND length(_autonomy_level) > 0 THEN filled := filled + 1; END IF;
  IF _contact_phone IS NOT NULL AND length(trim(_contact_phone)) > 0 THEN filled := filled + 1; END IF;
  IF _message IS NOT NULL AND length(trim(_message)) > 0 THEN filled := filled + 1; END IF;
  comp_pts := round(20.0 * filled / total);

  score := LEAST(100, budget_pts + timing_pts + comp_pts);

  INSERT INTO public.leads (
    residence_id, user_id, contact_name, contact_email, contact_phone, message,
    for_whom, region_target, budget_range, budget_min, budget_max,
    timing, autonomy_level, consent_rgpd, status, score,
    type, firstname, lastname, preferred_date, preferred_time, source_page
  ) VALUES (
    _residence_id, uid, _contact_name, _contact_email, _contact_phone, _message,
    _for_whom, _region_target, _budget_range, _budget_min, _budget_max,
    _timing, _autonomy_level, true, 'new', score,
    COALESCE(_type, 'info'), _firstname, _lastname, _preferred_date, _preferred_time, _source_page
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END $function$;
