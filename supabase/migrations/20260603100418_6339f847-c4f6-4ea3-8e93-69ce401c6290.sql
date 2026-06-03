-- Helper function for updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Enums
CREATE TYPE crm_contact_type AS ENUM ('groupe', 'residence_independante');
CREATE TYPE crm_contact_status AS ENUM ('a_contacter', 'contacte', 'en_discussion', 'demo_envoyee', 'partenaire', 'refus');
CREATE TYPE crm_contact_source AS ENUM ('liste_interne', 'linkedin', 'recommandation', 'evenement', 'autre');
CREATE TYPE crm_interaction_type AS ENUM ('appel', 'email', 'reunion', 'note');
CREATE TYPE crm_interaction_result AS ENUM ('positif', 'neutre', 'negatif');
CREATE TYPE crm_task_priority AS ENUM ('faible', 'normale', 'urgente');
CREATE TYPE crm_task_status AS ENUM ('a_faire', 'en_cours', 'termine');
CREATE TYPE crm_campaign_channel AS ENUM ('email', 'linkedin', 'telephone', 'evenement', 'autre');
CREATE TYPE crm_campaign_status AS ENUM ('planifiee', 'en_cours', 'terminee');
CREATE TYPE crm_campaign_contact_status AS ENUM ('cible', 'contacte', 'repondu', 'converti');

CREATE TABLE public.crm_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, logo_url text, website text, sector text, notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_groups TO authenticated;
GRANT ALL ON public.crm_groups TO service_role;
ALTER TABLE public.crm_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_groups_admin_all ON public.crm_groups FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type crm_contact_type NOT NULL DEFAULT 'residence_independante',
  group_id uuid REFERENCES public.crm_groups(id) ON DELETE SET NULL,
  residence_id uuid REFERENCES public.residences(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text, city text, postal_code text, region text,
  contact_firstname text, contact_lastname text, contact_role text,
  email text, phone text, website text,
  status crm_contact_status NOT NULL DEFAULT 'a_contacter',
  source crm_contact_source NOT NULL DEFAULT 'liste_interne',
  assigned_to uuid,
  next_followup_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_contacts_group ON public.crm_contacts(group_id);
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts(status);
CREATE INDEX idx_crm_contacts_assigned ON public.crm_contacts(assigned_to);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_contacts_admin_all ON public.crm_contacts FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  type crm_interaction_type NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  summary text NOT NULL,
  result crm_interaction_result,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_interactions_contact ON public.crm_interactions(contact_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interactions TO authenticated;
GRANT ALL ON public.crm_interactions TO service_role;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_interactions_admin_all ON public.crm_interactions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date, due_time time,
  assigned_to uuid,
  priority crm_task_priority NOT NULL DEFAULT 'normale',
  status crm_task_status NOT NULL DEFAULT 'a_faire',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to, due_date);
CREATE INDEX idx_crm_tasks_contact ON public.crm_tasks(contact_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_tasks_admin_all ON public.crm_tasks FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  objective text,
  channel crm_campaign_channel NOT NULL DEFAULT 'email',
  status crm_campaign_status NOT NULL DEFAULT 'planifiee',
  start_date date, end_date date,
  target_contacts integer NOT NULL DEFAULT 0,
  budget_estimated numeric,
  results_contacts_reached integer NOT NULL DEFAULT 0,
  results_positive_responses integer NOT NULL DEFAULT 0,
  results_new_partners integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaigns TO authenticated;
GRANT ALL ON public.crm_campaigns TO service_role;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_campaigns_admin_all ON public.crm_campaigns FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE public.crm_campaign_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  status crm_campaign_contact_status NOT NULL DEFAULT 'cible',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);
CREATE INDEX idx_crm_cc_campaign ON public.crm_campaign_contacts(campaign_id);
CREATE INDEX idx_crm_cc_contact ON public.crm_campaign_contacts(contact_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaign_contacts TO authenticated;
GRANT ALL ON public.crm_campaign_contacts TO service_role;
ALTER TABLE public.crm_campaign_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_cc_admin_all ON public.crm_campaign_contacts FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_crm_groups_updated BEFORE UPDATE ON public.crm_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_crm_tasks_updated BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_crm_campaigns_updated BEFORE UPDATE ON public.crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();