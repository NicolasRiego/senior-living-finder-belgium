import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, AlertTriangle, TrendingUp, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllLeads, updateLeadStatus, computeResponseHours, type LeadRow } from "@/modules/leads/api";
import { LeadStatusBadge, LeadTypeBadge } from "@/modules/leads/components/LeadStatusBadge";
import { isOverdueSla, timeAgo, LEAD_TYPE_META, LEAD_STATUS_META, type LeadType } from "@/modules/leads/labels";

const WON_KEYS = new Set(["converti", "won"]);

export default function AdminLeads() {
  const qc = useQueryClient();
  const [residenceFilter, setResidenceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<LeadType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useQuery({ queryKey: ["admin-leads"], queryFn: fetchAllLeads });
  const leads = query.data ?? [];

  const residencesList = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of leads) if (l.residences?.nom_fr) map.set(l.residence_id, l.residences.nom_fr);
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const filtered = useMemo(() => {
    let list = leads;
    if (residenceFilter !== "all") list = list.filter((l) => l.residence_id === residenceFilter);
    if (typeFilter !== "all") list = list.filter((l) => l.type === typeFilter);
    if (statusFilter !== "all") list = list.filter((l) => l.status === statusFilter);
    if (from) list = list.filter((l) => l.created_at >= from);
    if (to) list = list.filter((l) => l.created_at <= to + "T23:59:59");
    if (search.trim()) {
      const n = search.toLowerCase();
      list = list.filter((l) =>
        l.contact_name.toLowerCase().includes(n) ||
        l.contact_email.toLowerCase().includes(n) ||
        (l.firstname ?? "").toLowerCase().includes(n) ||
        (l.lastname ?? "").toLowerCase().includes(n),
      );
    }
    return list;
  }, [leads, residenceFilter, typeFilter, statusFilter, from, to, search]);

  const stats = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonth = leads.filter((l) => new Date(l.created_at) >= monthStart);
    const newUntouched = leads.filter((l) => l.status === "new").length;
    const won = leads.filter((l) => WON_KEYS.has(l.status)).length;
    const total = leads.length;
    const conv = total > 0 ? Math.round((won / total) * 100) : 0;
    const delays = leads.map(computeResponseHours).filter((v): v is number => v !== null);
    const avgDelay = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;
    return { monthCount: thisMonth.length, newUntouched, conv, avgDelay };
  }, [leads]);

  const overdue = useMemo(() => leads.filter((l) => isOverdueSla(l.status, l.created_at)), [leads]);

  const handleStatus = async (lead: LeadRow, next: string) => {
    try {
      await updateLeadStatus(lead.id, next as Parameters<typeof updateLeadStatus>[1]);
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><Inbox className="h-7 w-7 text-primary" /> Leads — toutes résidences</h1>
        <p className="mt-1 text-muted-foreground">Vue globale des demandes reçues sur la plateforme.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} label="Leads ce mois" value={stats.monthCount} />
        <StatCard icon={<AlertTriangle />} label="Nouveaux non traités" value={stats.newUntouched} tone={stats.newUntouched > 0 ? "destructive" : "default"} />
        <StatCard icon={<TrendingUp />} label="Taux de conversion" value={`${stats.conv}%`} />
        <StatCard icon={<Clock />} label="Délai moyen de réponse" value={stats.avgDelay !== null ? `${stats.avgDelay}h` : "—"} />
      </div>

      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <div className="font-semibold">⚠️ {overdue.length} lead{overdue.length > 1 ? "s" : ""} en attente depuis plus de 24h sans prise en charge</div>
            <div className="text-sm">Identifiez les résidences concernées dans le tableau ci-dessous.</div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Select label="Résidence" value={residenceFilter} onChange={setResidenceFilter}>
            <option value="all">Toutes</option>
            {residencesList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select label="Type" value={typeFilter} onChange={(v) => setTypeFilter(v as LeadType | "all")}>
            <option value="all">Tous</option>
            {(Object.keys(LEAD_TYPE_META) as LeadType[]).map((t) => <option key={t} value={t}>{LEAD_TYPE_META[t].label}</option>)}
          </Select>
          <Select label="Statut" value={statusFilter} onChange={setStatusFilter}>
            <option value="all">Tous</option>
            {Object.keys(LEAD_STATUS_META).map((s) => <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>)}
          </Select>
          <DateF label="Du" value={from} onChange={setFrom} />
          <DateF label="Au" value={to} onChange={setTo} />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Recherche</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, e-mail…" className="h-9" />
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Type</th><th className="p-3">Nom</th><th className="p-3">Résidence</th>
                <th className="p-3">Statut</th><th className="p-3">Date</th><th className="p-3">Délai réponse</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const delay = computeResponseHours(l);
                return (
                  <tr key={l.id} className="border-t border-border/60 hover:bg-muted/30 align-top">
                    <td className="p-3"><LeadTypeBadge type={l.type as LeadType} /></td>
                    <td className="p-3">
                      <div className="font-medium">{`${l.firstname ?? ""} ${l.lastname ?? ""}`.trim() || l.contact_name}</div>
                      <div className="text-xs text-muted-foreground">{l.contact_email}</div>
                    </td>
                    <td className="p-3">{l.residences?.nom_fr ?? "—"}</td>
                    <td className="p-3"><LeadStatusBadge status={l.status} /></td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{timeAgo(l.created_at)}</td>
                    <td className="p-3">{delay !== null ? `${Math.round(delay)}h` : (l.status === "new" ? <span className="text-destructive">En attente</span> : "—")}</td>
                    <td className="p-3">
                      <select className="h-8 rounded border border-input bg-background px-2 text-xs" value={l.status} onChange={(e) => handleStatus(l, e.target.value)} aria-label="Changer statut">
                        {Object.keys(LEAD_STATUS_META).map((s) => <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun lead.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string | number; tone?: "default" | "destructive" }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={"rounded-lg p-2 " + (tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={"text-2xl font-semibold " + (tone === "destructive" && Number(value) > 0 ? "text-destructive" : "")}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </div>
  );
}
function DateF({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}
