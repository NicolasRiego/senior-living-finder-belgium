
-- Enums
CREATE TYPE public.ticket_status AS ENUM ('a_reflechir','a_faire','en_cours','resolu');
CREATE TYPE public.ticket_priority AS ENUM ('faible','moderee','importante');

-- admin_tickets
CREATE TABLE public.admin_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.ticket_status NOT NULL DEFAULT 'a_reflechir',
  priority public.ticket_priority NOT NULL DEFAULT 'moderee',
  deadline date,
  screenshots text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_tickets TO authenticated;
GRANT ALL ON public.admin_tickets TO service_role;
ALTER TABLE public.admin_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_tickets_admin_select ON public.admin_tickets FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY admin_tickets_admin_insert ON public.admin_tickets FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());
CREATE POLICY admin_tickets_admin_update ON public.admin_tickets FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY admin_tickets_super_delete ON public.admin_tickets FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER admin_tickets_set_updated_at BEFORE UPDATE ON public.admin_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- admin_ticket_comments
CREATE TABLE public.admin_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.admin_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ticket_comments TO authenticated;
GRANT ALL ON public.admin_ticket_comments TO service_role;
ALTER TABLE public.admin_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tc_admin_select ON public.admin_ticket_comments FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY tc_admin_insert ON public.admin_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND author_id = auth.uid());
CREATE POLICY tc_author_or_super_delete ON public.admin_ticket_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE INDEX admin_ticket_comments_ticket_idx ON public.admin_ticket_comments(ticket_id, created_at DESC);

-- admin_ticket_participants
CREATE TABLE public.admin_ticket_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.admin_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ticket_participants TO authenticated;
GRANT ALL ON public.admin_ticket_participants TO service_role;
ALTER TABLE public.admin_ticket_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tp_admin_select ON public.admin_ticket_participants FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY tp_self_insert ON public.admin_ticket_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND user_id = auth.uid());
CREATE POLICY tp_self_delete ON public.admin_ticket_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- email batch tracking
CREATE TABLE public.admin_ticket_email_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.admin_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ticket_email_batches TO authenticated;
GRANT ALL ON public.admin_ticket_email_batches TO service_role;
ALTER TABLE public.admin_ticket_email_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY teb_admin_all ON public.admin_ticket_email_batches FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-participant triggers
CREATE OR REPLACE FUNCTION public.ticket_add_creator_participant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_ticket_participants(ticket_id, user_id)
  VALUES (NEW.id, NEW.created_by) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER admin_tickets_auto_participant AFTER INSERT ON public.admin_tickets
  FOR EACH ROW EXECUTE FUNCTION public.ticket_add_creator_participant();

CREATE OR REPLACE FUNCTION public.ticket_add_commenter_participant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_ticket_participants(ticket_id, user_id)
  VALUES (NEW.ticket_id, NEW.author_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER admin_ticket_comments_auto_participant AFTER INSERT ON public.admin_ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.ticket_add_commenter_participant();

-- RPC: list tickets with counts and participants
CREATE OR REPLACE FUNCTION public.admin_list_tickets()
RETURNS TABLE (
  id uuid, title text, description text, status public.ticket_status,
  priority public.ticket_priority, deadline date, screenshots text[],
  created_by uuid, creator_name text, creator_email text,
  created_at timestamptz, updated_at timestamptz,
  comment_count bigint, participant_count bigint, last_comment_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT t.id, t.title, t.description, t.status, t.priority, t.deadline, t.screenshots,
         t.created_by, p.display_name, u.email::text,
         t.created_at, t.updated_at,
         (SELECT count(*) FROM public.admin_ticket_comments c WHERE c.ticket_id = t.id),
         (SELECT count(*) FROM public.admin_ticket_participants pp WHERE pp.ticket_id = t.id),
         (SELECT max(c.created_at) FROM public.admin_ticket_comments c WHERE c.ticket_id = t.id)
  FROM public.admin_tickets t
  LEFT JOIN public.profiles p ON p.user_id = t.created_by
  LEFT JOIN auth.users u ON u.id = t.created_by
  ORDER BY t.updated_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_ticket_comments(_ticket_id uuid)
RETURNS TABLE (
  id uuid, ticket_id uuid, author_id uuid, author_name text, author_email text,
  content text, created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT c.id, c.ticket_id, c.author_id, p.display_name, u.email::text, c.content, c.created_at
  FROM public.admin_ticket_comments c
  LEFT JOIN public.profiles p ON p.user_id = c.author_id
  LEFT JOIN auth.users u ON u.id = c.author_id
  WHERE c.ticket_id = _ticket_id
  ORDER BY c.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_ticket_participants(_ticket_id uuid)
RETURNS TABLE (user_id uuid, display_name text, email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT pp.user_id, p.display_name, u.email::text
  FROM public.admin_ticket_participants pp
  LEFT JOIN public.profiles p ON p.user_id = pp.user_id
  LEFT JOIN auth.users u ON u.id = pp.user_id
  WHERE pp.ticket_id = _ticket_id;
END $$;

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-screenshots','ticket-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY ticket_screens_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ticket-screenshots');
CREATE POLICY ticket_screens_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-screenshots' AND public.is_admin(auth.uid()));
CREATE POLICY ticket_screens_admin_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ticket-screenshots' AND public.is_admin(auth.uid()));
CREATE POLICY ticket_screens_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-screenshots' AND public.is_admin(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_ticket_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_ticket_participants;
