import { useState } from "react";
import { z } from "zod";
import { Loader2, CalendarDays, FileText, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackResidenceEvent } from "@/modules/analytics/track";
import { PREFERRED_TIME_OPTIONS } from "@/modules/leads/labels";
import { QualifyFields, type QualifyState, EMPTY_QUALIFY } from "@/modules/leads/QualifyFields";

export type LeadIntent = "brochure" | "visit" | "callback" | "info";

const RATE_LIMIT_KEY = "sc_lead_last_submit";
const RATE_LIMIT_WINDOW_MS = 30_000;

const INTENT_TO_TYPE: Record<LeadIntent, "visite" | "brochure" | "rappel" | "info"> = {
  visit: "visite", brochure: "brochure", callback: "rappel", info: "info",
};

const INTENT_META: Record<LeadIntent, { title: string; description: string; icon: React.ReactNode }> = {
  visit: { title: "Demander une visite", description: "Choisissez votre date — la résidence vous confirme sous 24h.", icon: <CalendarDays className="h-5 w-5" /> },
  brochure: { title: "Recevoir la brochure", description: "Nous vous envoyons la brochure complète par e-mail.", icon: <FileText className="h-5 w-5" /> },
  callback: { title: "Être rappelé", description: "Un conseiller de la résidence vous appellera.", icon: <Phone className="h-5 w-5" /> },
  info: { title: "Demande d'informations", description: "Posez votre question — un conseiller vous recontacte sous 24h.", icon: <FileText className="h-5 w-5" /> },
};

const baseSchema = z.object({
  firstname: z.string().trim().min(2, "Prénom requis").max(80),
  lastname: z.string().trim().min(2, "Nom requis").max(80),
  contact_email: z.string().trim().email("E-mail invalide").max(255),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(500, "Maximum 500 caractères").optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  preferred_time: z.string().optional().or(z.literal("")),
  consent_rgpd: z.literal(true, { errorMap: () => ({ message: "Consentement requis" }) }),
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormState = {
  firstname: string; lastname: string; contact_email: string; contact_phone: string;
  message: string; preferred_date: string; preferred_time: string;
  consent_rgpd: boolean; website: string;
};

const EMPTY: FormState = {
  firstname: "", lastname: "", contact_email: "", contact_phone: "",
  message: "", preferred_date: "", preferred_time: "",
  consent_rgpd: false, website: "",
};

type Props = {
  residenceId: string;
  intent?: LeadIntent;
  trigger?: React.ReactNode;
  defaultRegion?: string;
};

export function LeadFormDialog({ residenceId, intent = "info", trigger, defaultRegion }: Props) {
  const [open, setOpen] = useState(false);
  const meta = INTENT_META[intent];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Demande d'informations</Button>}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{meta.icon} {meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        <LeadFormBody residenceId={residenceId} intent={intent} defaultRegion={defaultRegion} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function LeadFormBody({ residenceId, intent, defaultRegion, onDone }: { residenceId: string; intent: LeadIntent; defaultRegion?: string; onDone: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(EMPTY);
  const [qualify, setQualify] = useState<QualifyState>({ ...EMPTY_QUALIFY, region_target: defaultRegion ?? "" });
  const [showQualify, setShowQualify] = useState(false);

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const requiresPhone = intent === "callback" || intent === "visit";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const last = Number(localStorage.getItem(RATE_LIMIT_KEY) ?? 0);
    if (last && Date.now() - last < RATE_LIMIT_WINDOW_MS) {
      toast({ title: "Merci de patienter", description: "Vous avez déjà envoyé une demande récemment.", variant: "destructive" });
      return;
    }

    const schema = requiresPhone
      ? baseSchema.extend({ contact_phone: z.string().trim().min(6, "Téléphone requis").max(40) })
      : baseSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const k = issue.path[0]?.toString() ?? "_"; if (!flat[k]) flat[k] = issue.message; }
      setErrors(flat);
      return;
    }
    if (form.website) { onDone(); return; }

    setLoading(true);
    const contact_name = `${form.firstname} ${form.lastname}`.trim();
    const { error } = await supabase.rpc("submit_lead", {
      _residence_id: residenceId,
      _contact_name: contact_name,
      _contact_email: form.contact_email,
      _contact_phone: form.contact_phone || null,
      _message: form.message || null,
      _for_whom: qualify.for_whom || null,
      _region_target: qualify.region_target || null,
      _budget_range: qualify.budget_range || null,
      _budget_min: null,
      _budget_max: qualify.budget_max,
      _timing: qualify.timing || null,
      _autonomy_level: qualify.autonomy_level || null,
      _consent: true,
      _type: INTENT_TO_TYPE[intent],
      _firstname: form.firstname,
      _lastname: form.lastname,
      _preferred_date: form.preferred_date || null,
      _preferred_time: form.preferred_time || null,
      _source_page: typeof window !== "undefined" ? window.location.pathname : null,
    });

    setLoading(false);
    if (error) { toast({ title: "Erreur lors de l'envoi", description: error.message, variant: "destructive" }); return; }

    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
    trackResidenceEvent(residenceId, `lead_${intent === "info" ? "callback" : intent}` as any);
    toast({ title: "✓ Votre demande a été envoyée", description: "La résidence vous contactera sous 24h." });
    onDone();
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setF("website", e.target.value)} /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom *" error={errors.firstname}>
          <Input value={form.firstname} onChange={(e) => setF("firstname", e.target.value)} autoComplete="given-name" />
        </Field>
        <Field label="Nom *" error={errors.lastname}>
          <Input value={form.lastname} onChange={(e) => setF("lastname", e.target.value)} autoComplete="family-name" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail *" error={errors.contact_email}>
          <Input type="email" value={form.contact_email} onChange={(e) => setF("contact_email", e.target.value)} autoComplete="email" />
        </Field>
        <Field label={requiresPhone ? "Téléphone *" : "Téléphone"} error={errors.contact_phone}>
          <Input type="tel" value={form.contact_phone} onChange={(e) => setF("contact_phone", e.target.value)} autoComplete="tel" />
        </Field>
      </div>

      {intent === "visit" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date souhaitée">
            <Input type="date" value={form.preferred_date} onChange={(e) => setF("preferred_date", e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Heure préférée">
            <NativeSelect value={form.preferred_time} onChange={(v) => setF("preferred_time", v)} placeholder="Choisir…">
              {PREFERRED_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </NativeSelect>
          </Field>
        </div>
      )}

      {intent === "callback" && (
        <Field label="Meilleur moment pour vous rappeler">
          <NativeSelect value={form.preferred_time} onChange={(v) => setF("preferred_time", v)} placeholder="Choisir…">
            {PREFERRED_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NativeSelect>
        </Field>
      )}

      <Field label="Message (facultatif, max 500 caractères)" error={errors.message}>
        <Textarea rows={3} value={form.message} onChange={(e) => setF("message", e.target.value)} maxLength={500} />
        <div className="mt-1 text-right text-xs text-muted-foreground">{form.message.length}/500</div>
      </Field>

      <button type="button" onClick={() => setShowQualify((v) => !v)} className="text-sm text-primary hover:underline">
        {showQualify ? "− Masquer" : "+ Précisez votre projet (optionnel, accélère votre prise en charge)"}
      </button>
      {showQualify && <QualifyFields value={qualify} onChange={setQualify} />}

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.consent_rgpd} onChange={(e) => setF("consent_rgpd", e.target.checked)} className="mt-1" />
        <span>J'accepte que mes données soient transmises à la résidence pour traiter ma demande, conformément au RGPD.</span>
      </label>
      {errors.consent_rgpd && <p className="text-xs text-destructive">{errors.consent_rgpd}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : "Envoyer la demande"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (<div><Label className="mb-1.5 block">{label}</Label>{children}{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>);
}

function NativeSelect({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder?: string; children: React.ReactNode }) {
  return (
    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder ?? "—"}</option>
      {children}
    </select>
  );
}
