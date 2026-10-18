-- Messages envoyés depuis le formulaire de la page Contact du site
-- (à destination de info@mylivinghome.be, pas des résidences).
-- Chaque message est enregistré ici, puis la fonction notify-contact-message
-- envoie un e-mail à l'équipe et remplit notified_at.

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%'),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 50),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Tout visiteur peut envoyer un message, mais pas choisir la date d'envoi de l'e-mail.
CREATE POLICY contact_messages_public_insert ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (notified_at IS NULL);
-- Seuls les admins peuvent lire les messages.
CREATE POLICY contact_messages_admin_select ON public.contact_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
