ALTER TABLE public.residence_services
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS from_charges BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS charges_label TEXT DEFAULT NULL;

COMMENT ON COLUMN public.residence_services.is_free IS
  'true = service gratuit inclus sans surcoût';
COMMENT ON COLUMN public.residence_services.from_charges IS
  'true = service venant de l onglet Tarifs (charge obligatoire), non modifiable dans Services';
COMMENT ON COLUMN public.residence_services.charges_label IS
  'Intitulé de la charge d origine depuis l onglet Tarifs';