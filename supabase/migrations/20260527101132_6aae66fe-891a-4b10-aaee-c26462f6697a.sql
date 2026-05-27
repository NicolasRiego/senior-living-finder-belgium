
-- Fix 1: residence_search_view should use security_invoker so RLS of querying user applies
ALTER VIEW public.residence_search_view SET (security_invoker = true);

-- Fix 2: residence_charges should only expose charges for published residences
DROP POLICY IF EXISTS charges_public_read ON public.residence_charges;
CREATE POLICY charges_public_read ON public.residence_charges
  FOR SELECT
  USING (
    public.residence_is_published(residence_id)
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = residence_charges.residence_id AND m.user_id = auth.uid()
    )
  );

-- Fix 3: services_catalog insert must validate ownership of created_by_residence
DROP POLICY IF EXISTS services_catalog_auth_insert ON public.services_catalog;
CREATE POLICY services_catalog_auth_insert ON public.services_catalog
  FOR INSERT TO authenticated
  WITH CHECK (
    is_custom = true
    AND created_by_residence IS NOT NULL
    AND (
      public.is_admin(auth.uid())
      OR public.can_manage_residence(auth.uid(), created_by_residence)
    )
  );

-- Fix 4: activities_catalog insert must validate ownership of created_by_residence
DROP POLICY IF EXISTS activities_catalog_auth_insert ON public.activities_catalog;
CREATE POLICY activities_catalog_auth_insert ON public.activities_catalog
  FOR INSERT TO authenticated
  WITH CHECK (
    is_custom = true
    AND created_by_residence IS NOT NULL
    AND (
      public.is_admin(auth.uid())
      OR public.can_manage_residence(auth.uid(), created_by_residence)
    )
  );
