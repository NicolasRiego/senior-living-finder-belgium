import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackResidenceEvent } from "@/modules/analytics/track";

export type LeadIntent = "brochure" | "visit" | "callback" | "info";

const RATE_LIMIT_KEY = "sc_lead_last_submit";
const RATE_LIMIT_WINDOW_MS = 30_000; // 30s between submissions

const FOR_WHOM = [
  { value: "self", label: "Pour moi" },
  { value: "parent", label: "Pour un parent" },
  { value: "other", label: "Pour un proche" },
];
const REGIONS = ["Bruxelles", "Wallonie", "Flandre"];
const BUDGET_RANGES = [
  { value: "<1500", label: "Moins de 1 500 €", max: 1500 },
  { value: "1500_2000", label: "1 500 – 2 000 €", max: 2000 },
  { value: "2000_2500", label: "2 000 – 2 500 €", max: 2500 },
  { value: "2500_3000", label: "2 500 – 3 000 €", max: 3000 },
  { value: ">3000", label: "Plus de 3 000 €", max: 5000 },
];
const TIMINGS = [
  { value: "immediate", label: "Immédiat (< 1 mois)" },
  { value: "1_3_months", label: "1 à 3 mois" },
  { value: "3_6_months", label: "3 à 6 mois" },
  { value: "6_12_months", label: "6 à 12 mois" },
  { value: "later", label: "Plus tard / je m'informe" },
];
const AUTONOMY = [
  { value: "autonomous", label: "Autonome" },
  { value: "light_help", label: "Aide légère" },
  { value: "regular_care", label: "Soins réguliers" },
  { value: "heavy_care", label: "Dépendance importante" },
];

const schema = z.object({
  for_whom: z.enum(["self", "parent", "other"], { required_error: "Précisez pour qui" }),
  region_target: z.enum(["Bruxelles", "Wallonie", "Flandre"], { required_error: "Région requise" }),
  budget_range: z.string().min(1, "Budget requis"),
  timing: z.string().min(1, "Échéance requise"),
  autonomy_level: z.string().min(1, "Niveau d'autonomie requis"),
  contact_name: z.string().trim().min(2, "Nom requis").max(120),
  contact_email: z.string().trim().email("E-mail invalide").max(255),
  contact_phone: z.string().trim().min(6, "Téléphone requis").max(40),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent_rgpd: z.literal(true, { errorMap: () => ({ message: "Consentement requis" }) }),
  // honeypot — must remain empty
  website: z.string().max(0).optional().or(z.literal("")),
});

const intentTitles: Record<LeadIntent, string> = {
  brochure: "Recevoir la brochure",
  visit: "Demander une visite",
  callback: "Être rappelé",
  info: "Demande d'informations",
};

type Props = {
  residenceId: string;
  intent?: LeadIntent;
  trigger?: React.ReactNode;
  defaultRegion?: string;
};

export function LeadFormDialog({ residenceId, intent = "info", trigger, defaultRegion }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Demande d'informations</Button>}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{intentTitles[intent]}</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire — un conseiller vous recontacte sous 24h.
          </DialogDescription>
        </DialogHeader>
        <LeadFormBody
          residenceId={residenceId}
          intent={intent}
          defaultRegion={defaultRegion}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LeadFormBody({
  residenceId,
  intent,
  defaultRegion,
  onDone,
}: {
  residenceId: string;
  intent: LeadIntent;
  defaultRegion?: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    for_whom: "",
    region_target: defaultRegion ?? "",
    budget_range: "",
    timing: "",
    autonomy_level: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    message: "",
    consent_rgpd: false,
    website: "", // honeypot
  });

  const setField = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client rate-limit
    const last = Number(localStorage.getItem(RATE_LIMIT_KEY) ?? 0);
    if (last && Date.now() - last < RATE_LIMIT_WINDOW_MS) {
      toast({
        title: "Merci de patienter",
        description: "Vous avez déjà envoyé une demande récemment.",
        variant: "destructive",
      });
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? "_";
        if (!flat[k]) flat[k] = issue.message;
      }
      setErrors(flat);
      return;
    }

    // Honeypot caught (should never reach because zod allows max 0)
    if (form.website && form.website.length > 0) {
      onDone();
      return;
    }

    setLoading(true);
    const range = BUDGET_RANGES.find((b) => b.value === form.budget_range);
    const intentLabel = intentTitles[intent];
    const messageWithIntent = form.message
      ? `[${intentLabel}] ${form.message}`
      : `[${intentLabel}]`;

    const { error } = await supabase.rpc("submit_lead", {
      _residence_id: residenceId,
      _contact_name: form.contact_name,
      _contact_email: form.contact_email,
      _contact_phone: form.contact_phone || null,
      _message: messageWithIntent,
      _for_whom: form.for_whom,
      _region_target: form.region_target,
      _budget_range: form.budget_range,
      _budget_min: null,
      _budget_max: range?.max ?? null,
      _timing: form.timing,
      _autonomy_level: form.autonomy_level,
      _consent: true,
    });

    setLoading(false);
    if (error) {
      toast({
        title: "Erreur lors de l'envoi",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
    trackResidenceEvent(residenceId, `lead_${intent === "info" ? "callback" : intent}` as any);
    toast({
      title: "Demande envoyée",
      description: "Un conseiller vous recontacte rapidement.",
    });
    onDone();
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      {/* Honeypot — visually hidden */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Ne pas remplir
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setField("website", e.target.value)}
          />
        </label>
      </div>

      <Field label="Pour qui ?" error={errors.for_whom}>
        <RadioGroup value={form.for_whom} onChange={(v) => setField("for_whom", v)} options={FOR_WHOM} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Région ciblée" error={errors.region_target}>
          <Select value={form.region_target} onChange={(v) => setField("region_target", v)} placeholder="Choisir…">
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Budget mensuel" error={errors.budget_range}>
          <Select value={form.budget_range} onChange={(v) => setField("budget_range", v)} placeholder="Choisir…">
            {BUDGET_RANGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Échéance" error={errors.timing}>
          <Select value={form.timing} onChange={(v) => setField("timing", v)} placeholder="Choisir…">
            {TIMINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Niveau d'autonomie" error={errors.autonomy_level}>
          <Select value={form.autonomy_level} onChange={(v) => setField("autonomy_level", v)} placeholder="Choisir…">
            {AUTONOMY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Nom complet" error={errors.contact_name}>
        <Input value={form.contact_name} onChange={(e) => setField("contact_name", e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" error={errors.contact_email}>
          <Input type="email" value={form.contact_email} onChange={(e) => setField("contact_email", e.target.value)} />
        </Field>
        <Field label="Téléphone" error={errors.contact_phone}>
          <Input type="tel" value={form.contact_phone} onChange={(e) => setField("contact_phone", e.target.value)} />
        </Field>
      </div>

      <Field label="Message (facultatif)" error={errors.message}>
        <Textarea rows={3} value={form.message} onChange={(e) => setField("message", e.target.value)} maxLength={2000} />
      </Field>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent_rgpd}
          onChange={(e) => setField("consent_rgpd", e.target.checked)}
          className="mt-1"
        />
        <span>
          J'accepte que mes données soient transmises à la résidence pour traiter ma demande, conformément au RGPD.
        </span>
      </label>
      {errors.consent_rgpd && <p className="text-xs text-destructive">{errors.consent_rgpd}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : "Envoyer la demande"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Select({
  value, onChange, placeholder, children,
}: { value: string; onChange: (v: string) => void; placeholder?: string; children: React.ReactNode }) {
  return (
    <select
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder ?? "—"}</option>
      {children}
    </select>
  );
}

function RadioGroup({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "rounded-full border px-3.5 py-1.5 text-sm transition " +
            (value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/40")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
