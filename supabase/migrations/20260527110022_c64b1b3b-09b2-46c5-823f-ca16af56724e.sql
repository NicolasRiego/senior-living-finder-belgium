DROP VIEW IF EXISTS public.apartment_search_view;

CREATE VIEW public.apartment_search_view
  WITH (security_invoker = false)
AS
SELECT
  a.id,
  a.residence_id,
  a.title_fr,
  a.title_nl,
  a.type,
  a.surface_m2,
  a.floor,
  a.transaction_type,
  a.rent_price,
  a.sale_price,
  a.charges_monthly,
  a.parking,
  a.cave,
  a.terrace,
  a.garden,
  a.furnished,
  a.kitchen_equipped,
  a.elevator,
  a.wheelchair_accessible,
  a.status,
  a.available_from,
  a.description_fr,
  a.description_nl,
  a.is_demo,
  r.nom_fr AS residence_nom_fr,
  r.nom_nl AS residence_nom_nl,
  r.slug AS residence_slug,
  r.ville AS ville,
  r.region AS region,
  r.province AS province,
  r.code_postal AS code_postal,
  r.type_etablissement AS residence_type,
  (
    SELECT p.storage_path
    FROM public.photos p
    WHERE p.residence_id = r.id
      AND p.category = 'cover'::public.photo_category
    ORDER BY p.display_order ASC
    LIMIT 1
  ) AS cover_path
FROM public.apartments a
JOIN public.residences r
  ON r.id = a.residence_id
  AND r.status = 'published';

GRANT SELECT ON public.apartment_search_view TO anon, authenticated;