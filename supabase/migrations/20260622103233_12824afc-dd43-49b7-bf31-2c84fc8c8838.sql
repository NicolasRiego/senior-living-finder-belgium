
DO $$ BEGIN
  CREATE TYPE public.admin_task_priority AS ENUM ('basse','normale','haute','urgente');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_task_status AS ENUM ('a_faire','en_cours','en_attente','terminee');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  priority public.admin_task_priority NOT NULL DEFAULT 'normale',
  status public.admin_task_status NOT NULL DEFAULT 'a_faire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_tasks TO authenticated;
GRANT ALL ON public.admin_tasks TO service_role;

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin tasks" ON public.admin_tasks
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert admin tasks" ON public.admin_tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update admin tasks" ON public.admin_tasks
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete admin tasks" ON public.admin_tasks
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER admin_tasks_set_updated_at
  BEFORE UPDATE ON public.admin_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_admin_tasks_assigned_to ON public.admin_tasks(assigned_to);
CREATE INDEX idx_admin_tasks_status ON public.admin_tasks(status);

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE(user_id uuid, display_name text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT u.id, p.display_name, u.email::text
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin')
     OR COALESCE(p.is_super_admin, false) = true
  ORDER BY p.display_name NULLS LAST, u.email;
END $$;
