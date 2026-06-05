import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "@/modules/leads/labels";

export type LeadRow = {
  id: string;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  status: string;
  type: string;
  score: number;
  contact_name: string;
  firstname: string | null;
  lastname: string | null;
  contact_email: string;
  contact_phone: string | null;
  message: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  source_page: string | null;
  assigned_to: string | null;
  for_whom: string | null;
  region_target: string | null;
  budget_range: string | null;
  budget_max: number | null;
  timing: string | null;
  autonomy_level: string | null;
  residence_id: string;
  residences?: { nom_fr: string; slug?: string } | null;
};

const SELECT = "*, residences:residences(nom_fr, slug)";

export async function fetchAllLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as LeadRow[];
}

export async function fetchMyLeads(userId: string): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadRow[];
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase.rpc("update_lead_status", { _lead_id: leadId, _status: status });
  if (error) throw error;
}

export function computeResponseHours(l: LeadRow): number | null {
  if (!l.first_response_at) return null;
  return (new Date(l.first_response_at).getTime() - new Date(l.created_at).getTime()) / 3_600_000;
}
