
-- 1. Add structured frequency + responsable columns to residence_activities
ALTER TABLE public.residence_activities
  ADD COLUMN IF NOT EXISTS frequency_period text,
  ADD COLUMN IF NOT EXISTS frequency_count integer,
  ADD COLUMN IF NOT EXISTS responsable text;

-- 2. Per-residence custom "responsable" options
CREATE TABLE IF NOT EXISTS public.residence_responsables_custom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id uuid NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(residence_id, label)
);

GRANT SELECT ON public.residence_responsables_custom TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.residence_responsables_custom TO authenticated;
GRANT ALL ON public.residence_responsables_custom TO service_role;

ALTER TABLE public.residence_responsables_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responsables_custom_public_read"
  ON public.residence_responsables_custom FOR SELECT
  USING (residence_is_published(residence_id));

CREATE POLICY "responsables_custom_manage"
  ON public.residence_responsables_custom FOR ALL
  TO authenticated
  USING (can_manage_residence(auth.uid(), residence_id))
  WITH CHECK (can_manage_residence(auth.uid(), residence_id));
