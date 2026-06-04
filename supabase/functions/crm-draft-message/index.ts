// Edge function: draft a B2B prospecting email via Lovable AI Gateway
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `Tu es un expert en développement commercial pour SilverPlace, une plateforme belge de mise en relation entre seniors/familles et résidences seniors (type Immoweb des résidences seniors). SilverPlace permet aux résidences de créer leur profil, gérer leurs logements, et être trouvées par des milliers de familles belges cherchant une résidence senior. Le site est silverplace.be.

Tu rédiges des emails de prospection B2B professionnels, personnalisés et convaincants pour convaincre des groupes de résidences seniors belges de devenir partenaires SilverPlace.`;

const TYPE_LABELS: Record<string, string> = {
  premier_contact: "Premier contact",
  relance: "Relance après 7 jours sans réponse",
  suite_positif: "Suite à un échange positif",
  invitation_demo: "Invitation à une démo SilverPlace",
  bienvenue_partenaire: "Bienvenue nouveau partenaire",
};
const LANG_LABELS: Record<string, string> = { fr: "français", nl: "néerlandais", en: "anglais" };
const TONE_LABELS: Record<string, string> = {
  professionnel: "professionnel",
  chaleureux: "chaleureux",
  direct: "direct",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      messageType = "premier_contact",
      language = "fr",
      tone = "professionnel",
      contact = {},
      lastInteraction = null,
      residencesCount = 1,
      extraInstructions = "",
    } = body ?? {};

    const userPrompt = `Rédige un email de type "${TYPE_LABELS[messageType] ?? messageType}" en ${LANG_LABELS[language] ?? language} avec un ton ${TONE_LABELS[tone] ?? tone} pour le contact suivant :

- Nom du groupe/résidence : ${contact.name ?? "—"}
- Personne de contact : ${[contact.contact_firstname, contact.contact_lastname].filter(Boolean).join(" ") || "—"}${contact.contact_role ? `, ${contact.contact_role}` : ""}
- Nombre de résidences : ${residencesCount}
- Région : ${contact.region ?? "—"}
- Statut actuel : ${contact.status ?? "—"}
- Dernière interaction : ${lastInteraction || "aucune interaction précédente"}
- Notes sur le contact : ${contact.notes || "—"}
${extraInstructions ? `\nInstructions supplémentaires : ${extraInstructions}` : ""}

Réponds UNIQUEMENT en JSON valide au format suivant, sans aucun texte avant ou après :
{"subject": "Objet de l'email", "body": "Corps complet avec salutation et signature SilverPlace"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      const status = resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: txt || "AI gateway error" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { subject?: string; body?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // try to extract first JSON object
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    return new Response(
      JSON.stringify({ subject: parsed.subject ?? "", body: parsed.body ?? "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
