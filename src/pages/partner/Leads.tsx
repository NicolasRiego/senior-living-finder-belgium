import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Phone, Mail, MapPin, Sparkles, Filter, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STATUSES = [
  { value: "new", label: "Nouveau", color: "bg-primary text-primary-foreground" },
  { value: "contacted", label: "Contacté", color: "bg-blue-100 text-blue-900" },
  { value: "qualified", label: "Qualifié", color: "bg-indigo-100 text-indigo-900" },
  { value: "visit_scheduled", label: "Visite planifiée", color: "bg-amber-100 text-amber-900" },
  { value: "visit_done", label: "Visite réalisée", color: "bg-amber-200 text-amber-900" },
  { value: "won", label: "Clôturé (gagné)", color: "bg-green-100 text-green-900" },
  { value: "lost", label: "Non qualifié", color: "bg-muted text-muted-foreground" },
] as const;

type StatusValue = (typeof STATUSES)[number]["value"];

type LeadRow = {
  id: string;
  created_at: string;
  status: StatusValue;
  score: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  message: string | null;
  for_whom: string | null;
  region_target: string | null;
  budget_range: string | null;
  budget_max: number | null;
  timing: string | null;
  autonomy_level: string | null;
  residence_id: string;
  residences?: { nom_fr: string } | null;
};

const TIMING_LABELS: Record<string, string> = {
  immediate: "Immédiat",
  "1_3_months": "1–3 mois",
  "3_6_months": "3–6 mois",
  "6_12_months": "6–12 mois",
  later: "Plus tard",
};
const AUTONOMY_LABELS: Record<string, string> = {
  autonomous: "Autonome",
  light_help: "Aide légère",
  regular_care: "Soins réguliers",
  heavy_care: "Dépendance",
};
const FOR_WHOM_LABELS: Record<string, string> = {
  self: "Pour lui/elle",
  parent: "Pour un parent",
  other: "Pour un proche",
};

function statusMeta(s: string) {
  return STATUSES.find((x) => x.value === s) ?? STATUSES[0];
}

function scoreColor(score: number) {
  if (score >= 75) return "bg-green-100 text-green-900";
  if (score >= 50) return "bg-amber-100 text-amber-900";
  return "bg-muted text-muted-foreground";
}

export default function PartnerLeads() {
  const [statusFilter, setStatusFilter] = useState<StatusValue | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<LeadRow | null>(null);

  const query = useQuery({
    queryKey: ["partner-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, residences(nom_fr)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
  });

  const filtered = useMemo(() => {
    let list = query.data ?? [];
    if (statusFilter !== "all") list = list.filter((l) => l.status === statusFilter);
    if (search.trim()) {
      const n = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.contact_name.toLowerCase().includes(n) ||
          l.contact_email.toLowerCase().includes(n) ||
          (l.residences?.nom_fr ?? "").toLowerCase().includes(n),
      );
    }
    return list;
  }, [query.data, statusFilter, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: query.data?.length ?? 0 };
    for (const s of STATUSES) map[s.value] = 0;
    for (const l of query.data ?? []) map[l.status] = (map[l.status] ?? 0) + 1;
    return map;
  }, [query.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary" /> Leads
          </h1>
          <p className="mt-1 text-muted-foreground">
            Demandes des familles intéressées par vos résidences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-10 pl-9 w-64"
            />
          </div>
        </div>
      </header>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={statusFilter === "all"}
          label="Tous"
          count={counts.all}
          onClick={() => setStatusFilter("all")}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            active={statusFilter === s.value}
            label={s.label}
            count={counts[s.value]}
            onClick={() => setStatusFilter(s.value)}
          />
        ))}
      </div>

      {query.isLoading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center text-muted-foreground">
          Aucun lead pour ce filtre.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Score</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Résidence</th>
                <th className="p-3">Échéance</th>
                <th className="p-3">Statut</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const meta = statusMeta(l.status);
                return (
                  <tr key={l.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="p-3 align-top text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString("fr-BE")}
                    </td>
                    <td className="p-3 align-top">
                      <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " + scoreColor(l.score)}>
                        <Sparkles className="h-3 w-3" /> {l.score}
                      </span>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium">{l.contact_name}</div>
                      <div className="text-xs text-muted-foreground">{l.contact_email}</div>
                    </td>
                    <td className="p-3 align-top">{l.residences?.nom_fr ?? "—"}</td>
                    <td className="p-3 align-top">{TIMING_LABELS[l.timing ?? ""] ?? "—"}</td>
                    <td className="p-3 align-top">
                      <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " + meta.color}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-3 align-top">
                      <Button size="sm" variant="outline" onClick={() => setOpen(l)}>Ouvrir</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LeadDetailDialog lead={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function FilterChip({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
        (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")
      }
    >
      {label}{count != null && <span className="ml-1.5 opacity-70">{count}</span>}
    </button>
  );
}

function LeadDetailDialog({ lead, onClose }: { lead: LeadRow | null; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Log access on open
  useEffect(() => {
    if (lead?.id) {
      void supabase.rpc("log_lead_view", { _lead_id: lead.id });
    }
  }, [lead?.id]);

  if (!lead) return null;

  const updateStatus = async (next: StatusValue) => {
    setSaving(true);
    const { error } = await supabase.rpc("update_lead_status", {
      _lead_id: lead.id,
      _status: next,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Statut mis à jour" });
    qc.invalidateQueries({ queryKey: ["partner-leads"] });
    onClose();
  };

  return (
    <Dialog open={!!lead} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.contact_name}
            <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " + scoreColor(lead.score)}>
              <Sparkles className="h-3 w-3" /> Score {lead.score}/100
            </span>
          </DialogTitle>
          <DialogDescription>
            Demande reçue le {new Date(lead.created_at).toLocaleString("fr-BE")} · {lead.residences?.nom_fr ?? "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <Field label="E-mail" icon={<Mail className="h-3.5 w-3.5" />}>
            <a href={`mailto:${lead.contact_email}`} className="text-primary hover:underline">{lead.contact_email}</a>
          </Field>
          <Field label="Téléphone" icon={<Phone className="h-3.5 w-3.5" />}>
            {lead.contact_phone ? (
              <a href={`tel:${lead.contact_phone}`} className="text-primary hover:underline">{lead.contact_phone}</a>
            ) : "—"}
          </Field>
          <Field label="Pour qui">{FOR_WHOM_LABELS[lead.for_whom ?? ""] ?? "—"}</Field>
          <Field label="Région ciblée" icon={<MapPin className="h-3.5 w-3.5" />}>{lead.region_target ?? "—"}</Field>
          <Field label="Budget">
            {lead.budget_range ?? "—"}
            {lead.budget_max && <span className="text-muted-foreground"> (≤ {lead.budget_max} €)</span>}
          </Field>
          <Field label="Échéance">{TIMING_LABELS[lead.timing ?? ""] ?? "—"}</Field>
          <Field label="Autonomie">{AUTONOMY_LABELS[lead.autonomy_level ?? ""] ?? "—"}</Field>
        </div>

        {lead.message && (
          <div>
            <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Message</div>
            <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-line">{lead.message}</div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Statut</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                disabled={saving || s.value === lead.status}
                onClick={() => updateStatus(s.value)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 " +
                  (lead.status === s.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        {icon}{label}
      </div>
      <div>{children}</div>
    </div>
  );
}
