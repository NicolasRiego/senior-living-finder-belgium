import { supabase } from "@/integrations/supabase/client";
import type {
  CrmCampaign,
  CrmCampaignContact,
  CrmContact,
  CrmGroup,
  CrmInteraction,
  CrmTask,
} from "./types";

// ===== Groups =====
export async function listGroups() {
  const { data, error } = await supabase
    .from("crm_groups")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CrmGroup[];
}

export async function getGroup(id: string) {
  const { data, error } = await supabase.from("crm_groups").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CrmGroup | null;
}

export async function upsertGroup(g: Partial<CrmGroup> & { name: string }) {
  const { data, error } = await supabase.from("crm_groups").upsert(g).select().single();
  if (error) throw error;
  return data as CrmGroup;
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from("crm_groups").delete().eq("id", id);
  if (error) throw error;
}

// ===== Contacts =====
export async function listContacts() {
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmContact[];
}

export async function getContact(id: string) {
  const { data, error } = await supabase.from("crm_contacts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CrmContact | null;
}

export async function upsertContact(c: Partial<CrmContact> & { name: string }) {
  const { data, error } = await supabase.from("crm_contacts").upsert(c).select().single();
  if (error) throw error;
  return data as CrmContact;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateContactStatus(id: string, status: CrmContact["status"]) {
  const { error } = await supabase.from("crm_contacts").update({ status }).eq("id", id);
  if (error) throw error;
}

// ===== Interactions =====
export async function listInteractions(contactId?: string, limit = 50) {
  let q = supabase.from("crm_interactions").select("*").order("date", { ascending: false }).limit(limit);
  if (contactId) q = q.eq("contact_id", contactId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CrmInteraction[];
}

export async function createInteraction(i: Partial<CrmInteraction> & { contact_id: string; type: CrmInteraction["type"]; summary: string }) {
  const { data, error } = await supabase.from("crm_interactions").insert(i).select().single();
  if (error) throw error;
  return data as CrmInteraction;
}

// ===== Tasks =====
export async function listTasks(filters?: { assigned_to?: string; contact_id?: string; status?: CrmTask["status"]; due_before?: string }) {
  let q = supabase.from("crm_tasks").select("*").order("due_date", { ascending: true, nullsFirst: false });
  if (filters?.assigned_to) q = q.eq("assigned_to", filters.assigned_to);
  if (filters?.contact_id) q = q.eq("contact_id", filters.contact_id);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.due_before) q = q.lte("due_date", filters.due_before);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CrmTask[];
}

export async function upsertTask(t: Partial<CrmTask> & { title: string }) {
  const { data, error } = await supabase.from("crm_tasks").upsert(t).select().single();
  if (error) throw error;
  return data as CrmTask;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
  if (error) throw error;
}

// ===== Campaigns =====
export async function listCampaigns() {
  const { data, error } = await supabase
    .from("crm_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmCampaign[];
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase.from("crm_campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CrmCampaign | null;
}

export async function upsertCampaign(c: Partial<CrmCampaign> & { name: string }) {
  const { data, error } = await supabase.from("crm_campaigns").upsert(c).select().single();
  if (error) throw error;
  return data as CrmCampaign;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("crm_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function listCampaignContacts(campaignId: string) {
  const { data, error } = await supabase
    .from("crm_campaign_contacts")
    .select("*")
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return (data ?? []) as CrmCampaignContact[];
}

export async function addContactsToCampaign(campaignId: string, contactIds: string[]) {
  if (contactIds.length === 0) return;
  const rows = contactIds.map((cid) => ({ campaign_id: campaignId, contact_id: cid }));
  const { error } = await supabase.from("crm_campaign_contacts").upsert(rows, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function updateCampaignContactStatus(id: string, status: CrmCampaignContact["status"]) {
  const { error } = await supabase.from("crm_campaign_contacts").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function bulkMarkCampaignContacted(campaignId: string, contactIds: string[], campaignName: string, userId: string) {
  await supabase.from("crm_campaign_contacts").update({ status: "contacte" }).eq("campaign_id", campaignId);
  if (contactIds.length === 0) return;
  const interactions = contactIds.map((cid) => ({
    contact_id: cid,
    type: "email" as const,
    summary: `Via campagne ${campaignName}`,
    created_by: userId,
  }));
  await supabase.from("crm_interactions").insert(interactions);
}

// ===== Profiles for assignment / admins =====
export async function listAdmins() {
  const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (error) throw error;
  const ids = (roles ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [] as Array<{ user_id: string; display_name: string | null }>;
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
  return (profiles ?? []) as Array<{ user_id: string; display_name: string | null }>;
}
