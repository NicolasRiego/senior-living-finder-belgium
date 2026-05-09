ALTER TABLE public.services_catalog
  ADD COLUMN IF NOT EXISTS created_by_residence UUID REFERENCES public.residences(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.services_catalog.is_custom IS 'true = créé par un gestionnaire de résidence, visible uniquement pour cette résidence';
COMMENT ON COLUMN public.services_catalog.created_by_residence IS 'UUID de la résidence qui a créé ce service custom';

ALTER TABLE public.activities_catalog
  ADD COLUMN IF NOT EXISTS created_by_residence UUID REFERENCES public.residences(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.activities_catalog.is_custom IS 'true = créé par un gestionnaire de résidence, visible uniquement pour cette résidence';
COMMENT ON COLUMN public.activities_catalog.created_by_residence IS 'UUID de la résidence qui a créé cette activité custom';

CREATE POLICY "services_catalog_partner_insert"
  ON public.services_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );

CREATE POLICY "services_catalog_partner_update"
  ON public.services_catalog FOR UPDATE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );

CREATE POLICY "services_catalog_partner_delete"
  ON public.services_catalog FOR DELETE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );

CREATE POLICY "activities_catalog_partner_insert"
  ON public.activities_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );

CREATE POLICY "activities_catalog_partner_update"
  ON public.activities_catalog FOR UPDATE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );

CREATE POLICY "activities_catalog_partner_delete"
  ON public.activities_catalog FOR DELETE
  TO authenticated
  USING (
    is_custom = true AND (
      public.is_admin(auth.uid()) OR EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.residences r ON r.org_id = m.org_id
        WHERE m.user_id = auth.uid() AND r.id = created_by_residence
      )
    )
  );