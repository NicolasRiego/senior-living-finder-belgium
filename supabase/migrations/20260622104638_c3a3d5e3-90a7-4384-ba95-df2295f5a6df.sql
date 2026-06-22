
CREATE TABLE public.admin_task_assignees (
  task_id uuid NOT NULL REFERENCES public.admin_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_task_assignees TO authenticated;
GRANT ALL ON public.admin_task_assignees TO service_role;

ALTER TABLE public.admin_task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view task assignees" ON public.admin_task_assignees
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert task assignees" ON public.admin_task_assignees
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete task assignees" ON public.admin_task_assignees
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Migrate existing single-assignee values
INSERT INTO public.admin_task_assignees (task_id, user_id)
SELECT id, assigned_to FROM public.admin_tasks WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.admin_tasks DROP COLUMN assigned_to;
