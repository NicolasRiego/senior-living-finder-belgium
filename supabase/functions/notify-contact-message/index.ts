// Edge Function: notify-contact-message
// Called after a visitor sends the form on the site's Contact page.
// Reads the stored message (service role) and emails it to the site inbox
// (info@mylivinghome.be) via the Lovable Email API, once per message.
// The message is already saved in public.contact_messages, so a failed
// email never loses it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message_id } = (await req.json()) as { message_id?: string };
    if (!message_id) return json({ error: "missing message_id" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: msg } = await admin
      .from("contact_messages")
      .select("id, name, email, phone, message, created_at, notified_at")
      .eq("id", message_id)
      .maybeSingle();
    if (!msg) return json({ skipped: "not_found" });
    // One email per message, so the endpoint cannot be used to spam the inbox.
    if (msg.notified_at) return json({ skipped: "already_notified" });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ skipped: "email_not_configured" });

    const to = Deno.env.get("CONTACT_INBOX") ?? "info@mylivinghome.be";
    const name = escapeHtml(msg.name);
    const email = escapeHtml(msg.email);
    const phone = msg.phone ? escapeHtml(msg.phone) : "—";
    const body = escapeHtml(msg.message);
    const replyHref = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent("Votre message à MyLivingHome")}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px">
        <h2 style="margin:0 0 12px">Nouveau message depuis la page Contact</h2>
        <p style="margin:4px 0"><strong>Nom :</strong> ${name}</p>
        <p style="margin:4px 0"><strong>E-mail :</strong> ${email}</p>
        <p style="margin:4px 0"><strong>Téléphone :</strong> ${phone}</p>
        <blockquote style="border-left:3px solid #ddd;margin:16px 0;padding:8px 12px;color:#333;white-space:pre-wrap">${body}</blockquote>
        <p><a href="${replyHref}" style="background:#2f5d4a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Répondre à ${name}</a></p>
      </div>
    `;

    const res = await fetch("https://connector-gateway.lovable.dev/lovable-email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({ to, subject: `Nouveau message de contact : ${msg.name}`, html }),
    });
    if (!res.ok) {
      console.error("contact email failed", res.status, await res.text());
      return json({ sent: false }, 502);
    }

    await admin.from("contact_messages").update({ notified_at: new Date().toISOString() }).eq("id", msg.id);
    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
