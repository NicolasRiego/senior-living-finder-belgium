
# Plan — Système de leads enrichi

Objectif : étendre la table `leads` et le composant `LeadFormDialog` existants pour ajouter un typage explicite (visite/brochure/rappel), des champs dédiés (date/heure préférée, prénom/nom séparés, source), des statuts commerciaux (pris_en_charge/visite_planifiee/converti/perdu), un suivi SLA, et trois vues complètes (user / partenaire / admin).

## 1. Migration DB

**Nouveaux ENUM**
- `lead_type` : `visite | brochure | rappel | info` (garde `info` pour rétrocompat)
- Étendre `lead_status` : ajouter `pris_en_charge`, `visite_planifiee`, `converti`, `perdu` (garde `new`, `qualified`, `closed_won`, `closed_lost`, `archived`)

**Colonnes ajoutées à `leads`**
- `type lead_type NOT NULL DEFAULT 'info'`
- `firstname text`, `lastname text` (peuplés via trigger depuis `contact_name` pour la rétrocompat)
- `preferred_date date`, `preferred_time text` (matin/apres_midi/soir)
- `source_page text`
- `assigned_to uuid` (FK profiles.user_id)
- `first_response_at timestamptz` (set automatiquement au 1er changement de status hors `new`)
- `response_delay_hours numeric GENERATED ALWAYS AS ((EXTRACT EPOCH FROM (first_response_at - created_at))/3600) STORED`

**Trigger** : `before update` → si `status` passe de `new` à autre chose et `first_response_at IS NULL`, set `first_response_at = now()`.

**RPC `submit_lead`** : mise à jour pour accepter les nouveaux params (`_type`, `_firstname`, `_lastname`, `_preferred_date`, `_preferred_time`, `_source_page`). Tous les anciens params restent optionnels pour ne pas casser l'existant.

**RLS** : les policies actuelles (admin all / partner via `can_manage_residence` / user via `user_id`) couvrent déjà les besoins. Ajout d'une policy `leads_assigned_read` pour que l'`assigned_to` voie ses leads.

## 2. Frontend — formulaires publics

Refactor `src/modules/leads/LeadFormDialog.tsx` :
- 3 variantes de form selon `intent`: `visit` (date + heure + message), `brochure` (nom/email/phone/message), `callback` (nom/phone + moment + message)
- Champs `firstname` + `lastname` séparés (au lieu de `contact_name`)
- Garde budget/timing/autonomie en section pliable « Précisez votre projet (optionnel) » pour le scoring
- Capture `source_page = window.location.pathname`
- Toast de confirmation typé : « ✓ Votre demande a été envoyée. La résidence vous contactera sous 24h. »

## 3. Espace partenaire — `/partner/leads`

Refonte `src/pages/partner/Leads.tsx` :
- Badge sidebar avec count `status = 'new'`
- Liste de cards avec : badge type (🗓/📄/📞), nom, email, phone, résidence, « il y a X h », badge statut couleur, actions rapides (4 boutons), alerte SLA `>24h` si `status='new'`
- Filtres : résidence (si multi), type, status

## 4. Espace admin — `/admin/leads`

Nouvelle page `src/pages/admin/AdminLeads.tsx` + route :
- 4 cards stats : total mois, nouveaux non traités, taux conversion, délai moyen réponse
- Bannière SLA rouge si leads `new > 24h`
- Filtres : résidence, type, status, plage de dates, recherche nom/email
- Table : Type | Nom | Résidence | Statut | Date | Délai | Assigné | Actions
- Lien dans le dropdown `Commercial` du header admin

## 5. Mon espace — `/mon-espace/demandes`

Mise à jour `src/pages/account/MyAccount.tsx` (onglet Demandes) :
- Query `leads WHERE user_id = auth.uid()`
- Card par demande : type + résidence + date + statut traduit (Nouveau→« En attente de réponse », Pris en charge→« Votre demande est traitée », Visite planifiée→« Visite confirmée le … », Converti→« Dossier finalisé », Perdu→« Demande clôturée »)

## Détails techniques

**Fichiers à modifier**
- `supabase/migrations/<new>.sql` : enums + colonnes + trigger + RPC update
- `src/modules/leads/LeadFormDialog.tsx` : refactor multi-variant
- `src/modules/leads/api.ts` (nouveau) : `fetchPartnerLeads`, `fetchAdminLeads`, `fetchMyLeads`, `updateLeadStatus`, `assignLead`
- `src/modules/leads/components/LeadCard.tsx` (nouveau)
- `src/modules/leads/components/LeadStatusBadge.tsx` (nouveau)
- `src/modules/leads/labels.ts` (nouveau) : map status/type → label FR + couleur
- `src/pages/partner/Leads.tsx` : refonte
- `src/pages/admin/AdminLeads.tsx` (nouveau) + route dans `App.tsx`
- `src/components/layout/admin/AdminDropdown.tsx` : entrée « Leads » dans Commercial
- `src/pages/account/MyAccount.tsx` (ou composant onglet Demandes) : query réelle

**Respect des règles projet**
- Fichiers ≤ 200 lignes (découpe en sous-composants)
- TypeScript strict, props typées
- `useMemo` sur filtres, `React.memo` sur LeadCard
- Tokens HSL du design system uniquement (statut couleur = variants Badge)
- `aria-label` sur boutons icônes

## Hors scope explicite
- Pas de notification email auto au partenaire (peut être un edge function dans un 2e temps)
- Pas d'historique de changements de statut (audit_log existant peut suffire)

## Étapes d'exécution
1. Migration (validation user)
2. Refactor `LeadFormDialog` + API leads
3. Refonte espace partenaire
4. Nouvelle page admin + route + dropdown
5. Onglet « Mes demandes » user
