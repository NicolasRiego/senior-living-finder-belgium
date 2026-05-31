
-- 1) Block self-escalation to super_admin via profiles UPDATE
CREATE OR REPLACE FUNCTION public.prevent_super_admin_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only super admins can change is_super_admin';
    END IF;
  END IF;
  IF NEW.account_type IS DISTINCT FROM OLD.account_type AND NOT public.is_admin(auth.uid()) THEN
    -- Allow changing account_type only via admin; protect against silent privilege shifts
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_super_admin_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_super_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_self_escalation();

-- 2) Remove admin tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_tickets;
ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_ticket_comments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_ticket_participants;

-- 3) Make ticket-screenshots bucket private and restrict read to admins
UPDATE storage.buckets SET public = false WHERE id = 'ticket-screenshots';

DROP POLICY IF EXISTS ticket_screens_public_read ON storage.objects;
CREATE POLICY ticket_screens_admin_read ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'ticket-screenshots' AND public.is_admin(auth.uid()));
