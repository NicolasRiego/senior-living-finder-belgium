-- 1. Colonnes
ALTER TABLE public.services_catalog
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_residence UUID REFERENCES public.residences(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.activities_catalog
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_residence UUID REFERENCES public.residences(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.residence_services
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS from_charges BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS charges_label TEXT DEFAULT NULL;

-- 2. RLS services_catalog
DROP POLICY IF EXISTS "services_catalog_partner_insert" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_partner_update" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_partner_delete" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_public_read" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_read" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_auth_insert" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_auth_update" ON public.services_catalog;
DROP POLICY IF EXISTS "services_catalog_auth_delete" ON public.services_catalog;

CREATE POLICY "services_catalog_public_read"
  ON public.services_catalog FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "services_catalog_auth_insert"
  ON public.services_catalog FOR INSERT
  TO authenticated
  WITH CHECK (is_custom = true);

CREATE POLICY "services_catalog_auth_update"
  ON public.services_catalog FOR UPDATE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR
      created_by_residence IN (
        SELECT r.id FROM public.residences r
        JOIN public.org_members m ON m.org_id = r.org_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "services_catalog_auth_delete"
  ON public.services_catalog FOR DELETE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR
      created_by_residence IN (
        SELECT r.id FROM public.residences r
        JOIN public.org_members m ON m.org_id = r.org_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

-- 3. RLS activities_catalog
DROP POLICY IF EXISTS "activities_catalog_partner_insert" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_partner_update" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_partner_delete" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_read" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_public_read" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_auth_insert" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_auth_update" ON public.activities_catalog;
DROP POLICY IF EXISTS "activities_catalog_auth_delete" ON public.activities_catalog;

CREATE POLICY "activities_catalog_public_read"
  ON public.activities_catalog FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "activities_catalog_auth_insert"
  ON public.activities_catalog FOR INSERT
  TO authenticated
  WITH CHECK (is_custom = true);

CREATE POLICY "activities_catalog_auth_update"
  ON public.activities_catalog FOR UPDATE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR
      created_by_residence IN (
        SELECT r.id FROM public.residences r
        JOIN public.org_members m ON m.org_id = r.org_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "activities_catalog_auth_delete"
  ON public.activities_catalog FOR DELETE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR
      created_by_residence IN (
        SELECT r.id FROM public.residences r
        JOIN public.org_members m ON m.org_id = r.org_id
        WHERE m.user_id = auth.uid()
      )
    )
  );