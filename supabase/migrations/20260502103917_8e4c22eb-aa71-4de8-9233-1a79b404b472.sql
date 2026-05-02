-- Supprimer le compte existant pour permettre une réinscription propre en tant qu'admin
DELETE FROM auth.users WHERE email = 'nicolas.riego@outlook.com';

-- Créer une fonction helper pour promouvoir un utilisateur en admin par email après son inscription
CREATE OR REPLACE FUNCTION public.promote_email_to_admin(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = _email LIMIT 1;
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
END $$;

-- Trigger : si nicolas.riego@outlook.com s'inscrit, lui donner automatiquement le rôle admin
CREATE OR REPLACE FUNCTION public.auto_grant_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'nicolas.riego@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS auto_grant_admin_trigger ON auth.users;
CREATE TRIGGER auto_grant_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin();