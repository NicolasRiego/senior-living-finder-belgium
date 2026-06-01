
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS peb_certificate_url text,
  ADD COLUMN IF NOT EXISTS peb_certificate_name text,
  ADD COLUMN IF NOT EXISTS peb_certificate_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS peb_certificate_visible boolean NOT NULL DEFAULT true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('peb-certificates', 'peb-certificates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "peb_public_read" ON storage.objects;
CREATE POLICY "peb_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'peb-certificates');

DROP POLICY IF EXISTS "peb_partner_insert" ON storage.objects;
CREATE POLICY "peb_partner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'peb-certificates'
    AND EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE m.user_id = auth.uid()
        AND r.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "peb_partner_update" ON storage.objects;
CREATE POLICY "peb_partner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'peb-certificates'
    AND EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE m.user_id = auth.uid()
        AND r.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "peb_partner_delete" ON storage.objects;
CREATE POLICY "peb_partner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'peb-certificates'
    AND EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE m.user_id = auth.uid()
        AND r.id::text = (storage.foldername(name))[1]
    )
  );
