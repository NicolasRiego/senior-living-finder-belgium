ALTER TABLE public.residence_services
  ADD COLUMN IF NOT EXISTS price_unit text,
  ADD COLUMN IF NOT EXISTS lunch_price numeric,
  ADD COLUMN IF NOT EXISTS dinner_price numeric;