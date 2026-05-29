ALTER TABLE public.residences
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_residences_pinned ON public.residences (org_id, is_pinned, pinned_at DESC);