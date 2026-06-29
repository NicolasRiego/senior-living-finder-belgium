export type CrmContactType = "groupe" | "residence_independante";
export type CrmContactStatus =
  | "a_contacter"
  | "contacte"
  | "en_discussion"
  | "demo_envoyee"
  | "partenaire"
  | "refus";
export type CrmContactSource = "liste_interne" | "linkedin" | "recommandation" | "evenement" | "autre";
export type CrmInteractionType = "appel" | "email" | "reunion" | "note";
export type CrmInteractionResult = "positif" | "neutre" | "negatif";
export type CrmTaskPriority = "faible" | "normale" | "urgente";
export type CrmTaskStatus = "a_faire" | "en_cours" | "termine";
export type CrmCampaignChannel = "email" | "linkedin" | "telephone" | "evenement" | "autre";
export type CrmCampaignStatus = "planifiee" | "en_cours" | "terminee";
export type CrmCampaignContactStatus = "cible" | "contacte" | "repondu" | "converti";

export interface CrmGroup {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  sector: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmContact {
  id: string;
  type: CrmContactType;
  group_id: string | null;
  residence_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  region: string | null;
  contact_firstname: string | null;
  contact_lastname: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: CrmContactStatus;
  source: CrmContactSource;
  assigned_to: string | null;
  next_followup_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmInteraction {
  id: string;
  contact_id: string;
  type: CrmInteractionType;
  date: string;
  summary: string;
  content: string | null;
  result: CrmInteractionResult | null;
  created_by: string | null;
  created_at: string;
}

export type CrmMessageType =
  | "premier_contact"
  | "relance"
  | "suite_positif"
  | "invitation_demo"
  | "bienvenue_partenaire";
export type CrmMessageLanguage = "fr" | "nl" | "en";
export type CrmMessageTone = "professionnel" | "chaleureux" | "direct";

export interface CrmTemplate {
  id: string;
  name: string;
  message_type: CrmMessageType | string;
  language: CrmMessageLanguage | string;
  tone: CrmMessageTone | string;
  extra_instructions: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const MESSAGE_TYPE_LABELS: Record<CrmMessageType, string> = {
  premier_contact: "Premier contact",
  relance: "Relance (après 7 jours sans réponse)",
  suite_positif: "Suite à échange positif",
  invitation_demo: "Invitation démo MyLivingHome",
  bienvenue_partenaire: "Bienvenue nouveau partenaire",
};
export const MESSAGE_LANG_LABELS: Record<CrmMessageLanguage, string> = {
  fr: "Français",
  nl: "Nederlands",
  en: "English",
};
export const MESSAGE_TONE_LABELS: Record<CrmMessageTone, string> = {
  professionnel: "Professionnel",
  chaleureux: "Chaleureux",
  direct: "Direct",
};


export interface CrmTask {
  id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  assigned_to: string | null;
  priority: CrmTaskPriority;
  status: CrmTaskStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmCampaign {
  id: string;
  name: string;
  objective: string | null;
  channel: CrmCampaignChannel;
  status: CrmCampaignStatus;
  start_date: string | null;
  end_date: string | null;
  target_contacts: number;
  budget_estimated: number | null;
  results_contacts_reached: number;
  results_positive_responses: number;
  results_new_partners: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmCampaignContact {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: CrmCampaignContactStatus;
  created_at: string;
}

export const STATUS_LABELS: Record<CrmContactStatus, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  en_discussion: "En discussion",
  demo_envoyee: "Démo envoyée",
  partenaire: "Partenaire",
  refus: "Refus",
};

export const STATUS_COLORS: Record<CrmContactStatus, string> = {
  a_contacter: "bg-muted text-muted-foreground",
  contacte: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  en_discussion: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  demo_envoyee: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  partenaire: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  refus: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export const STATUS_ORDER: CrmContactStatus[] = [
  "a_contacter",
  "contacte",
  "en_discussion",
  "demo_envoyee",
  "partenaire",
  "refus",
];

export const PRIORITY_COLORS: Record<CrmTaskPriority, string> = {
  faible: "bg-muted text-muted-foreground",
  normale: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  urgente: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export const PRIORITY_LABELS: Record<CrmTaskPriority, string> = {
  faible: "Faible",
  normale: "Normale",
  urgente: "Urgente",
};

export const INTERACTION_LABELS: Record<CrmInteractionType, string> = {
  appel: "Appel",
  email: "Email",
  reunion: "Réunion",
  note: "Note",
};

export const SOURCE_LABELS: Record<CrmContactSource, string> = {
  liste_interne: "Liste interne",
  linkedin: "LinkedIn",
  recommandation: "Recommandation",
  evenement: "Événement",
  autre: "Autre",
};

export const CHANNEL_LABELS: Record<CrmCampaignChannel, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  telephone: "Téléphone",
  evenement: "Événement",
  autre: "Autre",
};

export const CAMPAIGN_STATUS_LABELS: Record<CrmCampaignStatus, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
};
