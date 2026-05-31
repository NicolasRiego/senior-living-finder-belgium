import { supabase } from "@/integrations/supabase/client";
import type { TicketComment, TicketParticipant, TicketPriority, TicketRow, TicketStatus } from "./types";

export async function listTickets(): Promise<TicketRow[]> {
  const { data, error } = await supabase.rpc("admin_list_tickets");
  if (error) throw error;
  return (data ?? []) as unknown as TicketRow[];
}

export async function listComments(ticketId: string): Promise<TicketComment[]> {
  const { data, error } = await supabase.rpc("admin_list_ticket_comments", { _ticket_id: ticketId });
  if (error) throw error;
  return (data ?? []) as unknown as TicketComment[];
}

export async function listParticipants(ticketId: string): Promise<TicketParticipant[]> {
  const { data, error } = await supabase.rpc("admin_list_ticket_participants", { _ticket_id: ticketId });
  if (error) throw error;
  return (data ?? []) as unknown as TicketParticipant[];
}

export interface TicketInput {
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  deadline?: string | null;
  screenshots: string[];
}

export async function createTicket(input: TicketInput, userId: string) {
  const { data, error } = await supabase
    .from("admin_tickets")
    .insert({ ...input, created_by: userId, deadline: input.deadline || null })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function updateTicket(id: string, input: Partial<TicketInput>) {
  const { error } = await supabase
    .from("admin_tickets")
    .update({ ...input, deadline: input.deadline || null })
    .eq("id", id);
  if (error) throw error;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { error } = await supabase.from("admin_tickets").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteTicket(id: string) {
  const { error } = await supabase.from("admin_tickets").delete().eq("id", id);
  if (error) throw error;
}

export async function getTicket(id: string) {
  const { data, error } = await supabase.from("admin_tickets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function addComment(ticketId: string, authorId: string, content: string) {
  const { error } = await supabase
    .from("admin_ticket_comments")
    .insert({ ticket_id: ticketId, author_id: authorId, content });
  if (error) throw error;
  // Fire-and-forget notification (won't throw on user)
  try {
    await supabase.functions.invoke("notify-ticket-comment", {
      body: { ticket_id: ticketId, author_id: authorId, content },
    });
  } catch {
    /* notification optional */
  }
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("admin_ticket_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleParticipant(ticketId: string, userId: string, follow: boolean) {
  if (follow) {
    const { error } = await supabase
      .from("admin_ticket_participants")
      .insert({ ticket_id: ticketId, user_id: userId });
    if (error && !error.message.includes("duplicate")) throw error;
  } else {
    const { error } = await supabase
      .from("admin_ticket_participants")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

export async function uploadScreenshot(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ticket-screenshots").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  // Store the storage path; consumers create short-lived signed URLs for display.
  return path;
}

/**
 * Resolves a stored screenshot reference to a signed URL.
 * Accepts either a raw storage path or a legacy public URL (which is normalized to a path).
 */
export async function getScreenshotSignedUrl(stored: string, expiresIn = 3600): Promise<string | null> {
  if (!stored) return null;
  let path = stored;
  const marker = "/ticket-screenshots/";
  const idx = stored.indexOf(marker);
  if (idx !== -1) path = stored.slice(idx + marker.length);
  const { data, error } = await supabase.storage
    .from("ticket-screenshots")
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
