-- 1. Add pmr_accessible boolean on residences
ALTER TABLE public.residences
  ADD COLUMN IF NOT EXISTS pmr_accessible BOOLEAN NOT NULL DEFAULT false;

-- Backfill from current heuristics: residence has a PMR-coded service included, or any apartment is wheelchair-accessible.
UPDATE public.residences r
SET pmr_accessible = true
WHERE r.pmr_accessible = false
  AND (
    EXISTS (
      SELECT 1 FROM public.residence_services rs
      JOIN public.services_catalog sc ON sc.id = rs.service_id
      WHERE rs.residence_id = r.id
        AND rs.included = true
        AND sc.code = ANY (ARRAY['pmr','accessibility_pmr','accessible_pmr'])
    )
    OR EXISTS (
      SELECT 1 FROM public.apartments a
      WHERE a.residence_id = r.id AND a.wheelchair_accessible = true
    )
  );

-- 2. Recreate residence_search_view with dynamic aggregates from apartments
DROP VIEW IF EXISTS public.residence_search_view;

CREATE VIEW public.residence_search_view
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
  (
    SELECT COUNT(*)::int
    FROM public.apartments a
    WHERE a.residence_id = r.id
  ) AS capacity,
  (
    SELECT MIN(a.surface_m2)
    FROM public.apartments a
    WHERE a.residence_id = r.id AND a.surface_m2 IS NOT NULL
  ) AS surface_min,
  (
    SELECT MAX(a.surface_m2)
    FROM public.apartments a
    WHERE a.residence_id = r.id AND a.surface_m2 IS NOT NULL
  ) AS surface_max,
  COALESCE((
    SELECT array_agg(DISTINCT a.type ORDER BY a.type)
    FROM public.apartments a
    WHERE a.residence_id = r.id AND a.type IS NOT NULL
  ), ARRAY[]::text[]) AS apartment_types,
  r.status,
  r.published_at,
  (
    SELECT (MIN(a.rent_price) + COALESCE((
      SELECT SUM(rc.amount)
      FROM public.residence_charges rc
      WHERE rc.residence_id = r.id
        AND rc.is_mandatory = true
        AND rc.amount > 0
        AND rc.label <> 'Nouveau service'
    ), 0))::numeric
    FROM public.apartments a
    WHERE a.residence_id = r.id
      AND a.status = 'available'
      AND a.transaction_type IN ('rent','both')
      AND a.rent_price IS NOT NULL
  ) AS price_from,
  (
    SELECT MIN(a.rent_price)::numeric
    FROM public.apartments a
    WHERE a.residence_id = r.id
      AND a.status = 'available'
      AND a.transaction_type IN ('rent','both')
      AND a.rent_price IS NOT NULL
  ) AS rent_from,
  public.residence_completeness(r.id) AS completeness,
  public.residence_completeness(r.id) >= 80 AS is_complete,
  (
    SELECT ph.storage_path
    FROM public.photos ph
    WHERE ph.residence_id = r.id AND ph.category = 'cover'::public.photo_category
    ORDER BY ph.display_order
    LIMIT 1
  ) AS cover_path,
  (EXISTS (
    SELECT 1 FROM public.apartments a
    WHERE a.residence_id = r.id AND a.status = 'available'
  )) AS has_availability,
  COALESCE(r.pmr_accessible, false) AS is_pmr,
  COALESCE((
    SELECT array_agg(sc.code)
    FROM public.residence_services rs
    JOIN public.services_catalog sc ON sc.id = rs.service_id
    WHERE rs.residence_id = r.id AND rs.included = true
  ), ARRAY[]::text[]) AS included_service_codes
FROM public.residences r;

GRANT SELECT ON public.residence_search_view TO anon, authenticated;