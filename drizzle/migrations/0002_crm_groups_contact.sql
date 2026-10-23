-- Personne de contact d'un groupe (CRM admin)
ALTER TABLE public.crm_groups
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;