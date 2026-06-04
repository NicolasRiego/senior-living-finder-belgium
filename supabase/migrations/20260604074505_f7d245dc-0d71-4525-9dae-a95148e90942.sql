
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

ALTER TABLE public.crm_interactions ADD COLUMN IF NOT EXISTS content text;

CREATE TABLE IF NOT EXISTS public.crm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_type text NOT NULL,
  language text NOT NULL DEFAULT 'fr',
  tone text NOT NULL DEFAULT 'professionnel',
  extra_instructions text,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_templates TO authenticated;
GRANT ALL ON public.crm_templates TO service_role;

ALTER TABLE public.crm_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_templates_admin_all" ON public.crm_templates;
CREATE POLICY "crm_templates_admin_all" ON public.crm_templates
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_crm_templates_updated_at ON public.crm_templates;
CREATE TRIGGER update_crm_templates_updated_at
  BEFORE UPDATE ON public.crm_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.crm_templates (name, message_type, language, tone, is_default, extra_instructions) VALUES
  ('Premier contact - FR pro', 'premier_contact', 'fr', 'professionnel', true, 'Présenter brièvement SilverPlace et proposer une démo.'),
  ('Relance 7 jours - FR', 'relance', 'fr', 'chaleureux', true, 'Rappeler le premier email avec tact, sans être insistant.'),
  ('Suite échange positif - FR', 'suite_positif', 'fr', 'chaleureux', true, 'Remercier pour l''échange et proposer les prochaines étapes.'),
  ('Invitation démo - FR', 'invitation_demo', 'fr', 'professionnel', true, 'Proposer 3 créneaux pour une démo de 30 minutes.'),
  ('Bienvenue partenaire - FR', 'bienvenue_partenaire', 'fr', 'chaleureux', true, 'Confirmer le partenariat et expliquer les prochaines étapes d''onboarding.');
