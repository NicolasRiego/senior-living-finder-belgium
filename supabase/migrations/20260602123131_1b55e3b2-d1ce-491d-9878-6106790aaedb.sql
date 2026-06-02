
CREATE TABLE public.simulator_logements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, apartment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulator_logements TO authenticated;
GRANT ALL ON public.simulator_logements TO service_role;

ALTER TABLE public.simulator_logements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulator_logements_self_all"
ON public.simulator_logements
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_simulator_logements_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.simulator_logements WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'simulator_logements_max_reached' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER simulator_logements_limit_trigger
BEFORE INSERT ON public.simulator_logements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_simulator_logements_limit();

CREATE INDEX idx_simulator_logements_user_id ON public.simulator_logements(user_id);
