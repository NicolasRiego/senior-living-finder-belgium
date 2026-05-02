-- App versions registry for deploy history
CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  commit_sha text,
  released_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_versions_released_at ON public.app_versions (released_at DESC);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write deploy history
CREATE POLICY app_versions_admin_read
  ON public.app_versions FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY app_versions_admin_write
  ON public.app_versions FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
