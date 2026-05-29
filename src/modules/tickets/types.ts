export type TicketStatus = "a_reflechir" | "a_faire" | "en_cours" | "resolu";
export type TicketPriority = "faible" | "moderee" | "importante";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  a_reflechir: "À réfléchir",
  a_faire: "À faire",
  en_cours: "En cours",
  resolu: "Résolu",
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ["a_reflechir", "a_faire", "en_cours", "resolu"];

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  faible: "Faible",
  moderee: "Modérée",
  importante: "Importante",
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  faible: "bg-muted text-muted-foreground",
  moderee: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  importante: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  deadline: string | null;
  screenshots: string[];
  created_by: string;
  creator_name: string | null;
  creator_email: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  participant_count: number;
  last_comment_at: string | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  content: string;
  created_at: string;
}

export interface TicketParticipant {
  user_id: string;
  display_name: string | null;
  email: string | null;
}
