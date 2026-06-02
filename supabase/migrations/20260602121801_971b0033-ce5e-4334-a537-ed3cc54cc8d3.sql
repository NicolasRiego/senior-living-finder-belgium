CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.budget_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  apartment_id UUID NOT NULL,
  selected_services JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_monthly INTEGER NOT NULL DEFAULT 0,
  total_annual INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_simulations TO authenticated;
GRANT ALL ON public.budget_simulations TO service_role;

ALTER TABLE public.budget_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_simulations_self_all"
ON public.budget_simulations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_budget_simulations_updated_at
BEFORE UPDATE ON public.budget_simulations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_budget_simulations_user ON public.budget_simulations(user_id, created_at DESC);
