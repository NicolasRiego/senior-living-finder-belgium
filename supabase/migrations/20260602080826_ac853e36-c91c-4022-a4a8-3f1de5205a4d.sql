CREATE TABLE public.saved_apartments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, apartment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_apartments TO authenticated;
GRANT ALL ON public.saved_apartments TO service_role;

ALTER TABLE public.saved_apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_apartments_self_all"
ON public.saved_apartments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_saved_apartments_user ON public.saved_apartments(user_id);
CREATE INDEX idx_saved_apartments_apartment ON public.saved_apartments(apartment_id);