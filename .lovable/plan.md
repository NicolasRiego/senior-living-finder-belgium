## Plan: refonte header admin + module tickets

### 1. Header admin réorganisé
- Refondre `src/components/layout/AdminLayout.tsx` :
  - Gauche : logo "Admin" (lien `/admin`), dropdown **Contenu** (Validation, Résidences, Utilisateurs), dropdown **Système** (Journal, Déploiements, Démo), lien **Tickets**, lien **Site public**.
  - Droite : dropdown **Mon espace** (Espace partenaire, Espace utilisateur), bouton icône **Déconnexion**.
- Dropdowns 100 % contrôlés en React (`useState`), click-to-toggle, fermeture sur clic extérieur (`useRef` + listener), `z-[9999]`. Jamais liés au scroll.
- Adaptation responsive : burger menu avec mêmes regroupements en mobile.

### 2. Base de données (migration Lovable Cloud)
Tables (schéma `public`, RLS admin uniquement) :
- `admin_tickets` : `id`, `title`, `description`, `status` (enum `a_reflechir|a_faire|en_cours|resolu`), `priority` (enum `faible|moderee|importante`), `deadline date`, `screenshots text[]`, `created_by uuid`, `created_at`, `updated_at`.
- `admin_ticket_comments` : `id`, `ticket_id`, `author_id`, `content`, `created_at`.
- `admin_ticket_participants` : `id`, `ticket_id`, `user_id`, `unique(ticket_id, user_id)`.
- Trigger auto-ajout participant à la création d'un ticket et à chaque commentaire.
- Trigger `updated_at`.
- GRANTs + RLS : lecture/écriture réservée aux admins (`is_admin(auth.uid())`), suppression de commentaires par auteur ou super admin.
- Bucket Storage `ticket-screenshots` (public en lecture, écriture admins).
- Realtime activé sur les 3 tables.

### 3. Edge Function `notify-ticket-comment`
- Déclenchée par webhook DB sur INSERT `admin_ticket_comments`.
- Récupère ticket, participants (sauf auteur du commentaire), emails via `auth.users`.
- Anti-spam : table `admin_ticket_email_batches` (ticket_id, user_id, last_sent_at, pending_comment_ids). Si dernier envoi < 15 min → ajout au lot, planification d'un envoi différé via `pg_cron` ou check à l'envoi suivant. Implémentation simple : si un envoi a eu lieu il y a moins de 15 min pour ce user/ticket, on stocke le commentaire en attente ; une fonction cron toutes les 5 min vide les lots en attente.
- Envoi via Resend (connector déjà disponible ? sinon utiliser Lovable Emails).
- Sujet : `💬 Nouvelle réponse sur le ticket: <title>`, corps HTML avec lien direct et lien unsubscribe.

### 4. Page liste `/admin/tickets`
- Kanban 4 colonnes (drag-and-drop pour changer statut via `@dnd-kit` déjà ou simple update sur drop).
- Carte : titre, badge priorité (couleurs), deadline, nb commentaires, miniature 1er screenshot, avatars participants, indicateur non-lu (compare `last_visited_at` stocké en localStorage par ticket).
- Barre de filtres : priorité, statut, créateur.
- Bouton "+ Nouveau ticket" → modal.

### 5. Modal création/édition ticket
- Champs : titre, description (textarea), priorité (boutons colorés), statut, deadline (`<input type="date">`), upload screenshots (max 3, vers bucket `ticket-screenshots`, preview + suppression).
- Save / Cancel.

### 6. Page détail `/admin/tickets/:id`
- Affichage complet, boutons Éditer (créateur ou super admin) et Supprimer (super admin, avec confirmation).
- Toggle 🔔 Suivre/Ne plus suivre (insert/delete dans participants).
- Section commentaires : liste threadée (avatar + nom + date + contenu), suppression par auteur, input de réponse, compteur "X participants suivent".

### 7. Routage
- Ajouter dans `src/App.tsx` :
  - `/admin/tickets` → `AdminTickets`
  - `/admin/tickets/:id` → `AdminTicketDetail`
- Ajouter "Tickets" dans la nav admin.

### 8. Route unsubscribe
- Edge function `ticket-unsubscribe` (ou route React `/admin/tickets/:id/unsubscribe?token=…`) qui supprime le participant.
- Token signé HMAC simple (secret) pour éviter unsubscribe non autorisé.

### Détails techniques
- Architecture respectant la règle "fichiers < 200 lignes" → découpage :
  - `src/modules/tickets/types.ts`
  - `src/modules/tickets/ticketsApi.ts`
  - `src/modules/tickets/TicketCard.tsx`
  - `src/modules/tickets/TicketColumn.tsx`
  - `src/modules/tickets/TicketModal.tsx`
  - `src/modules/tickets/TicketComments.tsx`
  - `src/modules/tickets/useTickets.ts`
  - `src/pages/admin/AdminTickets.tsx`
  - `src/pages/admin/AdminTicketDetail.tsx`
  - `src/components/layout/admin/AdminHeaderNav.tsx` (dropdowns contrôlés)
- Realtime Supabase pour mise à jour live du kanban et des commentaires.

### Question avant exécution
- **Emails** : tu préfères que j'utilise **Lovable Emails** (intégré, zéro config, recommandé) ou **Resend** (tu l'as mentionné explicitement, nécessitera de connecter le connector Resend et fournir une clé) ?

Réponds-moi sur ce point et je lance toute la suite (migration, edge function, UI) d'un bloc.