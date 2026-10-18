// Edge Function: notify-contact-message
// Called after a visitor sends the form on the site's Contact page.
// Reads the stored message (service role) and emails it to the site inbox
// (info@mylivinghome.be) via the Lovable Email API, once per message.
// The message is already saved in public.contact_messages, so a failed
// email never loses it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    const result = await sendTemplateEmail("contact-message-notification", "info@mylivinghome.be", {
      templateData: { name: msg.name, email: msg.email, phone: msg.phone ?? undefined, message: msg.message },
      idempotencyKey: `contact-message-${msg.id}`,
      replyTo: msg.email,
    });
    if (!result.sent) {
      console.error("contact email not sent", result);
      return json({ sent: false, reason: result.reason }, 200);
    }

    await admin.from("contact_messages").update({ notified_at: new Date().toISOString() }).eq("id", msg.id);
    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
