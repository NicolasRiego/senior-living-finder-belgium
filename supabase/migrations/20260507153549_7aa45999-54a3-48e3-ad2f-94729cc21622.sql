
-- 1. Add columns to apartments
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS charges_monthly INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_complement TEXT DEFAULT NULL;

COMMENT ON COLUMN public.apartments.charges_monthly IS
  'Charges mensuelles en euros (eau, chauffage, parties communes)';
COMMENT ON COLUMN public.apartments.address_complement IS
  'Numéro de porte, étage précis, bâtiment';

-- 2. Ensure org_members has unique constraint for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_members_org_user_unique'
  ) THEN
    ALTER TABLE public.org_members
      ADD CONSTRAINT org_members_org_user_unique UNIQUE (org_id, user_id);
  END IF;
END $$;

-- 3. RLS policies on apartments (granular replacement of apartments_manage)
DROP POLICY IF EXISTS apartments_manage ON public.apartments;
DROP POLICY IF EXISTS apartments_partner_read ON public.apartments;
DROP POLICY IF EXISTS apartments_partner_insert ON public.apartments;
DROP POLICY IF EXISTS apartments_partner_update ON public.apartments;
DROP POLICY IF EXISTS apartments_partner_delete ON public.apartments;

CREATE POLICY apartments_partner_read
  ON public.apartments FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = apartments.residence_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY apartments_partner_insert
  ON public.apartments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = apartments.residence_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY apartments_partner_update
  ON public.apartments FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = apartments.residence_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = apartments.residence_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY apartments_partner_delete
  ON public.apartments FOR DELETE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = apartments.residence_id
        AND m.user_id = auth.uid()
        AND m.role_in_org IN ('owner', 'manager')
    )
  );

-- 4. admin_claim_residence
CREATE OR REPLACE FUNCTION public.admin_claim_residence(_residence_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  SELECT org_id INTO v_org_id
  FROM public.residences
  WHERE id = _residence_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'residence not found';
  END IF;

  INSERT INTO public.org_members (org_id, user_id, role_in_org)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id)
  DO UPDATE SET role_in_org = 'owner';

  UPDATE public.profiles
  SET account_type = 'partner'
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (v_user_id, 'ADMIN_CLAIM', 'residences', _residence_id,
    jsonb_build_object('org_id', v_org_id));

  RETURN jsonb_build_object(
    'success', true,
    'residence_id', _residence_id,
    'org_id', v_org_id
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_claim_residence(uuid) TO authenticated;

-- 5. admin_list_residences_with_orgs
CREATE OR REPLACE FUNCTION public.admin_list_residences_with_orgs()
RETURNS TABLE (
  id uuid,
  nom_fr text,
  ville text,
  status text,
  org_id uuid,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.nom_fr,
    r.ville,
    r.status::text,
    r.org_id,
    (
      SELECT u.email::text
      FROM public.org_members m
      JOIN auth.users u ON u.id = m.user_id
      WHERE m.org_id = r.org_id
        AND m.role_in_org = 'owner'
      ORDER BY m.created_at ASC
      LIMIT 1
    ) AS owner_email
  FROM public.residences r
  ORDER BY r.nom_fr;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_list_residences_with_orgs() TO authenticated;
