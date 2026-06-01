CREATE TABLE public.apartment_custom_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL,
  label text NOT NULL,
  is_checked boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_apartment_custom_equipment_apartment ON public.apartment_custom_equipment(apartment_id);

GRANT SELECT ON public.apartment_custom_equipment TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartment_custom_equipment TO authenticated;
GRANT ALL ON public.apartment_custom_equipment TO service_role;

ALTER TABLE public.apartment_custom_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_equipment_public_read
  ON public.apartment_custom_equipment FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM apartments a
    JOIN residences r ON r.id = a.residence_id
    WHERE a.id = apartment_custom_equipment.apartment_id
      AND r.status = 'published'::publication_status
  ));

CREATE POLICY custom_equipment_partner_manage
  ON public.apartment_custom_equipment FOR ALL
  TO authenticated
  USING (
    is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM apartments a
      JOIN residences r ON r.id = a.residence_id
      JOIN org_members m ON m.org_id = r.org_id
      WHERE a.id = apartment_custom_equipment.apartment_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM apartments a
      JOIN residences r ON r.id = a.residence_id
      JOIN org_members m ON m.org_id = r.org_id
      WHERE a.id = apartment_custom_equipment.apartment_id
        AND m.user_id = auth.uid()
    )
  );