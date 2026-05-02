-- Public search view
CREATE OR REPLACE VIEW public.residence_search_view
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.slug,
  r.nom_fr,
  r.nom_nl,
  r.tagline_fr,
  r.tagline_nl,
  r.type_etablissement,
  r.adresse,
  r.code_postal,
  r.ville,
  r.province,
  r.region,
  r.capacity,
  r.status,
  r.published_at,
  -- Starting price (min of estimated_monthly_min across pricing)
  (
    SELECT MIN(p.estimated_monthly_min)
    FROM public.pricing p
    JOIN public.unit_types u ON u.id = p.unit_type_id
    WHERE u.residence_id = r.id AND p.estimated_monthly_min IS NOT NULL
  ) AS price_from,
  (
    SELECT MIN(p.rent_min)
    FROM public.pricing p
    JOIN public.unit_types u ON u.id = p.unit_type_id
    WHERE u.residence_id = r.id AND p.rent_min IS NOT NULL
  ) AS rent_from,
  -- Completeness score
  public.residence_completeness(r.id) AS completeness,
  (public.residence_completeness(r.id) >= 80) AS is_complete,
  -- Cover photo storage_path
  (
    SELECT ph.storage_path
    FROM public.photos ph
    WHERE ph.residence_id = r.id AND ph.category = 'cover'
    ORDER BY ph.display_order ASC
    LIMIT 1
  ) AS cover_path,
  -- Availability: any unit_type with available units
  EXISTS (
    SELECT 1 FROM public.unit_types u
    WHERE u.residence_id = r.id
      AND (u.available_now = true OR u.available_count > 0)
  ) AS has_availability,
  -- Accessibility (PMR) derived from services_catalog code
  EXISTS (
    SELECT 1 FROM public.residence_services rs
    JOIN public.services_catalog sc ON sc.id = rs.service_id
    WHERE rs.residence_id = r.id
      AND rs.included = true
      AND sc.code IN ('pmr', 'accessibility_pmr', 'accessible_pmr')
  ) AS is_pmr,
  -- Included service codes for filtering
  COALESCE((
    SELECT array_agg(sc.code)
    FROM public.residence_services rs
    JOIN public.services_catalog sc ON sc.id = rs.service_id
    WHERE rs.residence_id = r.id AND rs.included = true
  ), ARRAY[]::text[]) AS included_service_codes
FROM public.residences r;

GRANT SELECT ON public.residence_search_view TO anon, authenticated;