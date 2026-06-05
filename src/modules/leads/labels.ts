import type { Database } from "@/integrations/supabase/types";

export type LeadType = Database["public"]["Enums"]["lead_type"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

export const LEAD_TYPE_META: Record<LeadType, { label: string; icon: string; chip: string }> = {
  visite: { label: "Visite", icon: "🗓", chip: "bg-blue-100 text-blue-900 border-blue-200" },
  brochure: { label: "Brochure", icon: "📄", chip: "bg-purple-100 text-purple-900 border-purple-200" },
  rappel: { label: "Rappel", icon: "📞", chip: "bg-amber-100 text-amber-900 border-amber-200" },
  info: { label: "Information", icon: "✉️", chip: "bg-muted text-foreground border-border" },
};

export const LEAD_STATUS_META: Record<string, { label: string; chip: string; group: "open" | "in_progress" | "won" | "lost" }> = {
  new: { label: "Nouveau", chip: "bg-destructive text-destructive-foreground", group: "open" },
  pris_en_charge: { label: "Pris en charge", chip: "bg-amber-500 text-white", group: "in_progress" },
  contacted: { label: "Contacté", chip: "bg-amber-500 text-white", group: "in_progress" },
  qualified: { label: "Qualifié", chip: "bg-indigo-500 text-white", group: "in_progress" },
  visite_planifiee: { label: "Visite planifiée", chip: "bg-blue-500 text-white", group: "in_progress" },
  visit_scheduled: { label: "Visite planifiée", chip: "bg-blue-500 text-white", group: "in_progress" },
  visit_done: { label: "Visite réalisée", chip: "bg-blue-600 text-white", group: "in_progress" },
  converti: { label: "Converti", chip: "bg-green-600 text-white", group: "won" },
  won: { label: "Converti", chip: "bg-green-600 text-white", group: "won" },
  perdu: { label: "Perdu", chip: "bg-muted text-muted-foreground", group: "lost" },
  lost: { label: "Perdu", chip: "bg-muted text-muted-foreground", group: "lost" },
  archived: { label: "Archivé", chip: "bg-muted text-muted-foreground", group: "lost" },
};

/** User-facing friendly label for "Mes demandes" */
export const USER_STATUS_LABEL: Record<string, string> = {
  new: "En attente de réponse",
  pris_en_charge: "Votre demande est traitée",
  contacted: "Votre demande est traitée",
  qualified: "Votre dossier est en cours d'étude",
  visite_planifiee: "Visite confirmée",
  visit_scheduled: "Visite confirmée",
  visit_done: "Visite réalisée",
  converti: "Dossier finalisé",
  won: "Dossier finalisé",
  perdu: "Demande clôturée",
  lost: "Demande clôturée",
  archived: "Demande archivée",
};

export const PREFERRED_TIME_OPTIONS = [
  { value: "matin", label: "Matin (9h-12h)" },
  { value: "apres_midi", label: "Après-midi (12h-17h)" },
  { value: "soir", label: "Soir (17h-20h)" },
] as const;

export function statusMeta(s: string | null | undefined) {
  return LEAD_STATUS_META[s ?? "new"] ?? LEAD_STATUS_META.new;
}

export function typeMeta(t: LeadType | null | undefined) {
  return LEAD_TYPE_META[t ?? "info"] ?? LEAD_TYPE_META.info;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "À l'instant";
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-BE");
}

export function isOverdueSla(status: string, createdAt: string): boolean {
  if (status !== "new") return false;
  return Date.now() - new Date(createdAt).getTime() > 24 * 3_600_000;
}
