import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, AlertTriangle, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { fetchAllLeads, updateLeadStatus, type LeadRow } from "@/modules/leads/api";
import { isOverdueSla, LEAD_TYPE_META, type LeadType } from "@/modules/leads/labels";
import { LeadCard } from "@/modules/leads/components/LeadCard";

type StatusFilter = "all" | "open" | "in_progress" | "won" | "lost";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "open", label: "Nouveaux" },
  { value: "in_progress", label: "En cours" },
  { value: "won", label: "Convertis" },
  { value: "lost", label: "Perdus" },
];

const OPEN_STATUSES = new Set(["new"]);
const IN_PROGRESS = new Set(["pris_en_charge", "contacted", "qualified", "visite_planifiee", "visit_scheduled", "visit_done"]);
const WON = new Set(["converti", "won"]);
const LOST = new Set(["perdu", "lost", "archived"]);

function inFilter(status: string, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "open") return OPEN_STATUSES.has(status);
  if (f === "in_progress") return IN_PROGRESS.has(status);
  if (f === "won") return WON.has(status);
  return LOST.has(status);
}

export default function PartnerLeads() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<LeadType | "all">("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["partner-leads-v2"], queryFn: fetchAllLeads });

  const filtered = useMemo(() => {
    let list = query.data ?? [];
    list = list.filter((l) => inFilter(l.status, statusFilter));
    if (typeFilter !== "all") list = list.filter((l) => l.type === typeFilter);
    if (search.trim()) {
      const n = search.toLowerCase();
      list = list.filter((l) =>
        (l.firstname ?? "").toLowerCase().includes(n) ||
        (l.lastname ?? "").toLowerCase().includes(n) ||
        l.contact_name.toLowerCase().includes(n) ||
        l.contact_email.toLowerCase().includes(n) ||
        (l.residences?.nom_fr ?? "").toLowerCase().includes(n),
      );
    }
    return list;
  }, [query.data, statusFilter, typeFilter, search]);

  const overdueCount = useMemo(
    () => (query.data ?? []).filter((l) => isOverdueSla(l.status, l.created_at)).length,
    [query.data],
  );
  const newCount = useMemo(() => (query.data ?? []).filter((l) => l.status === "new").length, [query.data]);

  const handleAction = async (lead: LeadRow, next: "pris_en_charge" | "visite_planifiee" | "converti" | "perdu") => {
    setBusyId(lead.id);
    try {
      await updateLeadStatus(lead.id, next);
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["partner-leads-v2"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary" /> Leads
            {newCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">{newCount} nouveau{newCount > 1 ? "x" : ""}</span>
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">Demandes des familles intéressées par vos résidences.</p>
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="h-10 w-64 pl-9" aria-label="Rechercher un lead" />
        </div>
      </header>

      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <div className="font-semibold">{overdueCount} lead{overdueCount > 1 ? "s" : ""} en attente depuis plus de 24h</div>
            <div className="text-sm">Pensez à les prendre en charge pour respecter votre engagement de réponse sous 24h.</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Chip key={t.value} active={statusFilter === t.value} onClick={() => setStatusFilter(t.value)}>{t.label}</Chip>
        ))}
        <span className="mx-2 my-auto h-5 w-px bg-border" aria-hidden />
        <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Tous types</Chip>
        {(Object.keys(LEAD_TYPE_META) as LeadType[]).map((t) => (
          <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{LEAD_TYPE_META[t].icon} {LEAD_TYPE_META[t].label}</Chip>
        ))}
      </div>

      {query.isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center text-muted-foreground">Aucun lead pour ce filtre.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <LeadCard key={l.id} lead={l} busy={busyId === l.id} onAction={(s) => handleAction(l, s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={"rounded-full border px-3 py-1.5 text-sm font-medium transition " + (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")}>
      {children}
    </button>
  );
}
