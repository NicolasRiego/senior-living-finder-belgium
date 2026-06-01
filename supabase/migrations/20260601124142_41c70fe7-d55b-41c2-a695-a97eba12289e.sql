
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS co_ownership_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS co_ownership_description text;

CREATE TABLE IF NOT EXISTS public.apartment_additional_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  description text,
  is_included boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS apartment_additional_charges_apartment_idx
  ON public.apartment_additional_charges(apartment_id);

GRANT SELECT ON public.apartment_additional_charges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_additional_charges TO authenticated;
GRANT ALL ON public.apartment_additional_charges TO service_role;

ALTER TABLE public.apartment_additional_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "additional_charges_public_read"
ON public.apartment_additional_charges
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.apartments a
  JOIN public.residences r ON r.id = a.residence_id
  WHERE a.id = apartment_additional_charges.apartment_id
    AND r.status = 'published'
));

CREATE POLICY "additional_charges_partner_manage"
ON public.apartment_additional_charges
FOR ALL
TO authenticated
USING (
  is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.residences r ON r.id = a.residence_id
    JOIN public.org_members m ON m.org_id = r.org_id
    WHERE a.id = apartment_additional_charges.apartment_id
      AND m.user_id = auth.uid()
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.residences r ON r.id = a.residence_id
    JOIN public.org_members m ON m.org_id = r.org_id
    WHERE a.id = apartment_additional_charges.apartment_id
      AND m.user_id = auth.uid()
  )
);
