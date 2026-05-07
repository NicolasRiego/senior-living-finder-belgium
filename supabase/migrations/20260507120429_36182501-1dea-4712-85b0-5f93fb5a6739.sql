
CREATE TABLE public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  title_fr TEXT,
  title_nl TEXT,
  type TEXT CHECK (type IN ('appartement','chambre','studio')),
  surface_m2 INTEGER,
  floor INTEGER,
  sale_price INTEGER,
  rent_price INTEGER,
  transaction_type TEXT CHECK (transaction_type IN ('sale','rent','both')),
  parking BOOLEAN NOT NULL DEFAULT false,
  cave BOOLEAN NOT NULL DEFAULT false,
  terrace BOOLEAN NOT NULL DEFAULT false,
  garden BOOLEAN NOT NULL DEFAULT false,
  furnished BOOLEAN NOT NULL DEFAULT false,
  kitchen_equipped BOOLEAN NOT NULL DEFAULT false,
  elevator BOOLEAN NOT NULL DEFAULT false,
  wheelchair_accessible BOOLEAN NOT NULL DEFAULT false,
  available_from DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','unavailable')),
  description_fr TEXT,
  description_nl TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apartments_residence_id ON public.apartments(residence_id);
CREATE INDEX idx_apartments_status ON public.apartments(status);
CREATE INDEX idx_apartments_transaction_type ON public.apartments(transaction_type);

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY apartments_public_read
  ON public.apartments FOR SELECT
  TO anon, authenticated
  USING (public.residence_is_published(residence_id));

CREATE POLICY apartments_manage
  ON public.apartments FOR ALL
  TO authenticated
  USING (public.can_manage_residence(auth.uid(), residence_id))
  WITH CHECK (public.can_manage_residence(auth.uid(), residence_id));

CREATE TRIGGER apartments_set_updated_at
  BEFORE UPDATE ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Search view (security_invoker so underlying RLS applies)
CREATE OR REPLACE VIEW public.apartment_search_view
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.residence_id,
  r.slug AS residence_slug,
  r.nom_fr AS residence_nom_fr,
  r.nom_nl AS residence_nom_nl,
  r.ville,
  r.region,
  r.province,
  r.code_postal,
  a.type,
  a.surface_m2,
  a.floor,
  a.sale_price,
  a.rent_price,
  a.transaction_type,
  a.parking,
  a.cave,
  a.terrace,
  a.garden,
  a.furnished,
  a.kitchen_equipped,
  a.elevator,
  a.wheelchair_accessible,
  a.available_from,
  a.status,
  a.description_fr,
  a.description_nl,
  (SELECT p.storage_path FROM public.photos p
    WHERE p.residence_id = r.id AND p.category = 'cover'
    ORDER BY p.display_order ASC LIMIT 1) AS cover_path
FROM public.apartments a
JOIN public.residences r ON r.id = a.residence_id;

GRANT SELECT ON public.apartment_search_view TO anon, authenticated;
