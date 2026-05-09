CREATE TABLE IF NOT EXISTS public.residence_charges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id  UUID NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  description   TEXT,
  amount        INTEGER NOT NULL DEFAULT 0,
  is_mandatory  BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.residence_charges IS
  'Charges et services obligatoires ou optionnels de la résidence (indépendants du type de logement)';
COMMENT ON COLUMN public.residence_charges.label IS
  'Ex: Sécurité 24h/24, Nettoyage parties communes, Accueil & conciergerie';
COMMENT ON COLUMN public.residence_charges.amount IS
  'Montant mensuel en euros';
COMMENT ON COLUMN public.residence_charges.is_mandatory IS
  'true = obligatoire pour tous les résidents, false = optionnel';

ALTER TABLE public.residence_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charges_public_read"
  ON public.residence_charges FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "charges_partner_write"
  ON public.residence_charges FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = residence_charges.residence_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = residence_charges.residence_id
        AND m.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS residence_charges_updated_at ON public.residence_charges;
CREATE TRIGGER residence_charges_updated_at
  BEFORE UPDATE ON public.residence_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_residence_charges_residence
  ON public.residence_charges(residence_id, sort_order);

ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS charges_monthly INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.apartments.charges_monthly IS
  'Charges mensuelles spécifiques à cet appartement (eau, chauffage, électricité parties communes)';
