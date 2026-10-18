-- Numéro de ticket lisible (#1, #2…) pour retrouver un ticket facilement.
-- Les tickets existants sont numérotés dans l'ordre de leur création,
-- les nouveaux reçoivent automatiquement le numéro suivant.

ALTER TABLE public.admin_tickets ADD COLUMN number integer;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.admin_tickets
)
UPDATE public.admin_tickets t SET number = ordered.rn
FROM ordered WHERE ordered.id = t.id;

CREATE SEQUENCE public.admin_tickets_number_seq OWNED BY public.admin_tickets.number;
SELECT setval('public.admin_tickets_number_seq',
              COALESCE((SELECT max(number) FROM public.admin_tickets), 0) + 1, false);
GRANT USAGE, SELECT ON SEQUENCE public.admin_tickets_number_seq TO authenticated;

ALTER TABLE public.admin_tickets
  ALTER COLUMN number SET DEFAULT nextval('public.admin_tickets_number_seq'),
  ALTER COLUMN number SET NOT NULL,
  ADD CONSTRAINT admin_tickets_number_key UNIQUE (number);

-- La liste des tickets renvoie maintenant aussi le numéro.
DROP FUNCTION public.admin_list_tickets();
CREATE FUNCTION public.admin_list_tickets()
RETURNS TABLE (
  id uuid, number integer, title text, description text, status public.ticket_status,
  priority public.ticket_priority, deadline date, screenshots text[],
  created_by uuid, creator_name text, creator_email text,
  created_at timestamptz, updated_at timestamptz,
  comment_count bigint, participant_count bigint, last_comment_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT t.id, t.number, t.title, t.description, t.status, t.priority, t.deadline, t.screenshots,
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
