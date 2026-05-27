DROP VIEW IF EXISTS public.apartment_search_view;

CREATE VIEW public.apartment_search_view
WITH (security_invoker = true) AS
SELECT
  a.*,
  r.nom_fr AS residence_nom_fr,
  r.nom_nl AS residence_nom_nl,
  r.slug AS residence_slug,
  r.ville AS ville,
  r.region AS region,
  r.province AS province,
  r.code_postal AS code_postal,
  r.type_etablissement AS residence_type,
  (SELECT p.storage_path
   FROM public.photos p
   WHERE p.residence_id = r.id
     AND p.category = 'cover'::public.photo_category
   ORDER BY p.display_order ASC
   LIMIT 1
  ) AS cover_path
FROM public.apartments a
JOIN public.residences r ON r.id = a.residence_id
WHERE r.status = 'published';

GRANT SELECT ON public.apartment_search_view TO anon, authenticated;