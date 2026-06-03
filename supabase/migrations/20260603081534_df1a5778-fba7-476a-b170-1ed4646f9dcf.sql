
-- Search profiles for residence attribution (admin only)
CREATE OR REPLACE FUNCTION public.admin_search_profiles_for_attribution(
  _query text,
  _only_partners boolean DEFAULT true
)
RETURNS TABLE(user_id uuid, display_name text, email text, account_type text, is_partner boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    u.email::text,
    p.account_type,
    EXISTS(
      SELECT 1 FROM public.org_members m WHERE m.user_id = p.user_id
    ) OR p.account_type = 'partner' AS is_partner
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE
    (
      _query IS NULL OR length(trim(_query)) < 2
      OR p.display_name ILIKE '%' || _query || '%'
      OR u.email ILIKE '%' || _query || '%'
    )
    AND (
      _only_partners = false
      OR p.account_type = 'partner'
      OR public.is_admin(p.user_id)
      OR EXISTS(SELECT 1 FROM public.org_members m WHERE m.user_id = p.user_id)
    )
  ORDER BY p.display_name NULLS LAST, u.email
  LIMIT 50;
END;
$$;

-- Assign a residence to any user (admin only)
CREATE OR REPLACE FUNCTION public.admin_assign_residence(
  _residence_id uuid,
  _target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_actor uuid := auth.uid();
  v_promoted boolean := false;
BEGIN
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'target user required';
  END IF;

  SELECT org_id INTO v_org_id
  FROM public.residences
  WHERE id = _residence_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'residence not found';
  END IF;

  -- Promote to partner if not already
  UPDATE public.profiles
  SET account_type = 'partner'
  WHERE user_id = _target_user_id
    AND account_type IS DISTINCT FROM 'partner';
  GET DIAGNOSTICS v_promoted = ROW_COUNT;

  INSERT INTO public.org_members (org_id, user_id, role_in_org)
  VALUES (v_org_id, _target_user_id, 'owner')
  ON CONFLICT (org_id, user_id)
  DO UPDATE SET role_in_org = 'owner';

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (v_actor, 'ADMIN_ASSIGN', 'residences', _residence_id,
    jsonb_build_object('org_id', v_org_id, 'target_user_id', _target_user_id, 'promoted', v_promoted));

  RETURN jsonb_build_object(
    'success', true,
    'residence_id', _residence_id,
    'org_id', v_org_id,
    'target_user_id', _target_user_id,
    'promoted', v_promoted
  );
END;
$$;
