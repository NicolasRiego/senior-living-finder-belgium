// Edge Function: notify-ticket-comment
// Triggered when a new comment is added to an admin ticket.
// Sends an email (via Lovable Email API if configured, otherwise no-op) to all
// participants of the ticket EXCEPT the comment author.
// Anti-spam: per (ticket_id, user_id), skip if an email was sent in the last 15 min.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  ticket_id: string;
  author_id: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { ticket_id, author_id, content } = (await req.json()) as Payload;
    if (!ticket_id || !author_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch ticket
    const { data: ticket } = await admin
      .from("admin_tickets")
      .select("id, title")
      .eq("id", ticket_id)
      .maybeSingle();
    if (!ticket) {
      return new Response(JSON.stringify({ skipped: "ticket_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch author info
    const { data: authorUser } = await admin.auth.admin.getUserById(author_id);
    const authorEmail = authorUser?.user?.email ?? "Quelqu'un";

    // Fetch participants except the author
    const { data: parts } = await admin
      .from("admin_ticket_participants")
      .select("user_id")
      .eq("ticket_id", ticket_id)
      .neq("user_id", author_id);

    const FIFTEEN_MIN_AGO = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const APP_URL = Deno.env.get("APP_URL") ?? "https://mylivinghome.be";

    const recipients: string[] = [];
    for (const p of parts ?? []) {
      // Check batch (skip if recent send)
      const { data: batch } = await admin
        .from("admin_ticket_email_batches")
        .select("last_sent_at")
        .eq("ticket_id", ticket_id)
        .eq("user_id", p.user_id)
        .maybeSingle();
      if (batch && batch.last_sent_at > FIFTEEN_MIN_AGO) continue;

      const { data: u } = await admin.auth.admin.getUserById(p.user_id);
      const email = u?.user?.email;
      if (!email) continue;

      // Try to send via Lovable Email Gateway if available
      if (LOVABLE_API_KEY) {
        try {
          const subject = `💬 Nouvelle réponse sur le ticket: ${ticket.title}`;
          const excerpt = (content || "").slice(0, 300);
          const ticketUrl = `${APP_URL}/admin/tickets/${ticket_id}`;
          const html = `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px">
              <h2 style="margin:0 0 8px">${ticket.title}</h2>
              <p style="color:#555"><strong>${authorEmail}</strong> a répondu :</p>
              <blockquote style="border-left:3px solid #ddd;padding:8px 12px;color:#333;white-space:pre-wrap">${excerpt}</blockquote>
              <p><a href="${ticketUrl}" style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Voir le ticket</a></p>
              <p style="font-size:12px;color:#777;margin-top:24px">
                <a href="${APP_URL}/admin/tickets/${ticket_id}">Ne plus suivre ce ticket</a>
              </p>
            </div>
          `;
          await fetch("https://connector-gateway.lovable.dev/lovable-email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
            },
            body: JSON.stringify({ to: email, subject, html }),
          });
          recipients.push(email);
        } catch (e) {
          console.error("email send failed", e);
        }
      }

      // Upsert batch
      await admin
        .from("admin_ticket_email_batches")
        .upsert(
          { ticket_id, user_id: p.user_id, last_sent_at: new Date().toISOString() },
          { onConflict: "ticket_id,user_id" },
        );
    }

    return new Response(JSON.stringify({ ok: true, sent: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
