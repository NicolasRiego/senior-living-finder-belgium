ALTER VIEW public.residence_search_view SET (security_invoker = false);
ALTER VIEW public.apartment_search_view SET (security_invoker = false);

DROP POLICY IF EXISTS apartments_public_read ON public.apartments;
CREATE POLICY apartments_public_read
  ON public.apartments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.residences r
      WHERE r.id = apartments.residence_id
        AND r.status = 'published'
    )
  );

DROP POLICY IF EXISTS charges_public_read ON public.residence_charges;
CREATE POLICY charges_public_read
  ON public.residence_charges FOR SELECT
  TO anon, authenticated
  USING (public.residence_is_published(residence_id));

DROP POLICY IF EXISTS photos_public_read ON public.photos;
CREATE POLICY photos_public_read
  ON public.photos FOR SELECT
  TO anon, authenticated
  USING (public.residence_is_published(residence_id));

GRANT SELECT ON public.residence_search_view TO anon, authenticated;
GRANT SELECT ON public.apartment_search_view TO anon, authenticated;
GRANT SELECT ON public.photos TO anon, authenticated;
GRANT SELECT ON public.apartments TO anon, authenticated;
GRANT SELECT ON public.residence_charges TO anon, authenticated;