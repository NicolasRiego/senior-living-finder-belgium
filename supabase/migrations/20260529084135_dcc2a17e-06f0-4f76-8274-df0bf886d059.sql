
-- Add super admin flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Seed super admin for nicolas.riego@outlook.com if account exists
UPDATE public.profiles p
SET is_super_admin = true
FROM auth.users u
WHERE u.id = p.user_id AND u.email = 'nicolas.riego@outlook.com';

-- Ensure newly created super admin profile gets the flag
CREATE OR REPLACE FUNCTION public.auto_grant_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'nicolas.riego@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET is_super_admin = true WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END $function$;

-- Helper: is super admin?
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_super_admin = true)
$$;

-- List all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  account_type text,
  is_super_admin boolean,
  is_admin boolean,
  is_partner boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.display_name,
    COALESCE(p.account_type, 'family'),
    COALESCE(p.is_super_admin, false),
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'partner_member'),
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Set user role
-- _role in ('admin','partner','user'); only super admin can grant/revoke 'admin'
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  target_is_admin boolean;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_admin(caller) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _role NOT IN ('admin','partner','user') THEN RAISE EXCEPTION 'invalid_role'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = 'admin')
    INTO target_is_admin;

  -- Only super admin can promote to admin or demote an existing admin
  IF (_role = 'admin' OR target_is_admin) AND NOT public.is_super_admin(caller) THEN
    RAISE EXCEPTION 'only_super_admin_can_manage_admin_role';
  END IF;

  -- Never allow demoting the super admin
  IF target_is_admin AND public.is_super_admin(_target_user_id) AND _role <> 'admin' THEN
    RAISE EXCEPTION 'cannot_demote_super_admin';
  END IF;

  -- Apply role: clear current admin/partner_member entries, then add the right one
  DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role IN ('admin','partner_member','caregiver');

  IF _role = 'admin' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_target_user_id, 'admin');
    UPDATE public.profiles SET account_type = 'partner' WHERE user_id = _target_user_id;
  ELSIF _role = 'partner' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_target_user_id, 'partner_member');
    UPDATE public.profiles SET account_type = 'partner' WHERE user_id = _target_user_id;
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (_target_user_id, 'caregiver');
    UPDATE public.profiles SET account_type = 'family' WHERE user_id = _target_user_id;
  END IF;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (caller, 'USER_ROLE_CHANGE', 'user_roles', _target_user_id,
    jsonb_build_object('new_role', _role));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
