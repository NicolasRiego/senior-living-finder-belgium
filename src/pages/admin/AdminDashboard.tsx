import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  HandshakeIcon,
  MessageSquare,
  TrendingUp,
  Phone,
  Mail,
  Users2,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
  Building2,
  UserPlus,
  ListChecks,
  Ticket as TicketIcon,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CrmContact,
  CrmContactStatus,
  CrmInteraction,
  CrmTask,
} from "@/modules/crm/types";
import { STATUS_LABELS, STATUS_ORDER, INTERACTION_LABELS } from "@/modules/crm/types";
import { formatDate } from "@/modules/crm/ui";

const INTERACTION_ICONS = { appel: Phone, email: Mail, reunion: Users2, note: StickyNote } as const;

const STATUS_BAR_COLORS: Record<CrmContactStatus, string> = {
  a_contacter: "bg-muted-foreground/60",
  contacte: "bg-blue-500",
  en_discussion: "bg-orange-500",
  demo_envoyee: "bg-purple-500",
  partenaire: "bg-green-600",
  refus: "bg-red-500",
};

interface ResidenceRow {
  id: string;
  nom_fr: string;
  ville: string | null;
  created_at: string;
  org_id: string;
  org_email?: string | null;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
  account_type: string;
  email?: string | null;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export default function AdminDashboard() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [residences, setResidences] = useState<ResidenceRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [urgentTickets, setUrgentTickets] = useState(0);
  const [pendingValidation, setPendingValidation] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, i, t, r, p, ti, val] = await Promise.all([
          supabase.from("crm_contacts").select("*"),
          supabase.from("crm_interactions").select("*").order("date", { ascending: false }).limit(5),
          supabase.from("crm_tasks").select("*").neq("status", "termine"),
          supabase
            .from("residences")
            .select("id, nom_fr, ville, created_at, org_id")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("profiles")
            .select("user_id, display_name, created_at, account_type")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("admin_tickets")
            .select("id", { count: "exact", head: true })
            .eq("priority", "importante")
            .neq("status", "resolu"),
          supabase
            .from("residences")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_review"),
        ]);
        if (c.error) throw c.error;
        if (i.error) throw i.error;
        if (t.error) throw t.error;
        if (r.error) throw r.error;
        if (p.error) throw p.error;

        setContacts((c.data ?? []) as CrmContact[]);
        setInteractions((i.data ?? []) as CrmInteraction[]);
        setTasks((t.data ?? []) as CrmTask[]);
        setResidences((r.data ?? []) as ResidenceRow[]);
        setProfiles((p.data ?? []) as ProfileRow[]);
        setUrgentTickets(ti.count ?? 0);
        setPendingValidation(val.count ?? 0);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const contactsById = useMemo(() => {
    const m = new Map<string, CrmContact>();
    contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contacts]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const partners = contacts.filter((c) => c.status === "partenaire").length;
    const discussing = contacts.filter(
      (c) => c.status === "en_discussion" || c.status === "demo_envoyee" || c.status === "contacte",
    ).length;
    const conversion = total > 0 ? Math.round((partners / total) * 1000) / 10 : 0;
    return { total, partners, discussing, conversion };
  }, [contacts]);

  const statusCounts = useMemo(() => {
    const m: Record<CrmContactStatus, number> = {
      a_contacter: 0,
      contacte: 0,
      en_discussion: 0,
      demo_envoyee: 0,
      partenaire: 0,
      refus: 0,
    };
    contacts.forEach((c) => {
      m[c.status] = (m[c.status] ?? 0) + 1;
    });
    return m;
  }, [contacts]);

  const maxStatus = Math.max(1, ...Object.values(statusCounts));

  const alerts = useMemo(() => {
    const today = new Date();
    const cutoff = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    // Compute last interaction per contact
    const lastByContact = new Map<string, Date>();
    interactions.forEach((i) => {
      const d = new Date(i.date);
      const cur = lastByContact.get(i.contact_id);
      if (!cur || d > cur) lastByContact.set(i.contact_id, d);
    });
    // staleContacts: contacts whose last interaction (or created_at if none) is older than 14d
    const stale = contacts.filter((c) => {
      const last = lastByContact.get(c.id) ?? new Date(c.created_at);
      return last < cutoff && c.status !== "refus" && c.status !== "partenaire";
    }).length;

    const todayStr = today.toISOString().slice(0, 10);
    const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < todayStr).length;

    return { stale, overdueTasks };
  }, [contacts, interactions, tasks]);

  const noAlerts =
    alerts.stale === 0 && alerts.overdueTasks === 0 && urgentTickets === 0 && pendingValidation === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-primary">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble commerciale et opérationnelle</p>
      </div>

      {/* SECTION 1 — Vue d'ensemble CRM */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-primary">Vue d'ensemble CRM</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total contacts CRM" value={stats.total} />
          <StatCard icon={<HandshakeIcon className="h-5 w-5" />} label="Partenaires actifs" value={stats.partners} />
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="En discussion" value={stats.discussing} />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Taux de conversion"
            value={`${stats.conversion}%`}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STATUS_ORDER.map((s) => {
                const count = statusCounts[s];
                const pct = (count / maxStatus) * 100;
                return (
                  <div key={s} className="grid grid-cols-[160px_1fr_40px] items-center gap-3">
                    <div className="text-sm text-muted-foreground">{STATUS_LABELS[s]}</div>
                    <div className="h-6 rounded bg-muted overflow-hidden">
                      <div
                        className={`h-full ${STATUS_BAR_COLORS[s]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right text-sm font-medium tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2 — Activité récente */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-primary">Activité récente</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Interactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Dernières interactions CRM</CardTitle>
              <Link to="/admin/crm" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune interaction.</p>
              ) : (
                <ul className="space-y-3">
                  {interactions.map((i) => {
                    const Icon = INTERACTION_ICONS[i.type];
                    const contact = contactsById.get(i.contact_id);
                    return (
                      <li key={i.id} className="flex items-start gap-2 text-sm">
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium truncate">
                              {contact?.name ?? "Contact supprimé"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {INTERACTION_LABELS[i.type]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {i.summary.length > 50 ? i.summary.slice(0, 50) + "…" : i.summary}
                          </p>
                          <p className="text-xs text-muted-foreground">{timeAgo(i.date)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Residences */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Dernières résidences publiées</CardTitle>
              <Link to="/admin/residences" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </CardHeader>
            <CardContent>
              {residences.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune résidence.</p>
              ) : (
                <ul className="space-y-3">
                  {residences.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 text-sm">
                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{r.nom_fr}</div>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.ville ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Profiles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Derniers utilisateurs inscrits</CardTitle>
              <Link to="/admin/utilisateurs" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
              ) : (
                <ul className="space-y-3">
                  {profiles.map((p) => (
                    <li key={p.user_id} className="flex items-start gap-2 text-sm">
                      <UserPlus className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p.display_name ?? "—"}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs h-5">
                            {p.account_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(p.created_at)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3 — Alertes */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-primary">Alertes</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : noAlerts ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Tout est à jour — aucune alerte
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.stale > 0 && (
              <AlertCard
                tone="red"
                icon={<AlertTriangle className="h-5 w-5" />}
                label={`${alerts.stale} contact${alerts.stale > 1 ? "s" : ""} sans interaction depuis +14 jours`}
                to="/admin/crm/contacts?stale=14"
              />
            )}
            {alerts.overdueTasks > 0 && (
              <AlertCard
                tone="orange"
                icon={<ListChecks className="h-5 w-5" />}
                label={`${alerts.overdueTasks} tâche${alerts.overdueTasks > 1 ? "s" : ""} en retard`}
                to="/admin/crm?overdue=1"
              />
            )}
            {urgentTickets > 0 && (
              <AlertCard
                tone="red"
                icon={<TicketIcon className="h-5 w-5" />}
                label={`${urgentTickets} ticket${urgentTickets > 1 ? "s" : ""} urgent${urgentTickets > 1 ? "s" : ""} non résolu${urgentTickets > 1 ? "s" : ""}`}
                to="/admin/tickets?priority=importante"
              />
            )}
            {pendingValidation > 0 && (
              <AlertCard
                tone="yellow"
                icon={<ListChecks className="h-5 w-5" />}
                label={`${pendingValidation} résidence${pendingValidation > 1 ? "s" : ""} en attente de validation`}
                to="/admin/validation"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-md p-2 bg-primary-soft text-primary">{icon}</div>
          <div>
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  tone,
  icon,
  label,
  to,
}: {
  tone: "red" | "orange" | "yellow";
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  const cls =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900 dark:text-red-200"
      : tone === "orange"
        ? "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-900 dark:text-orange-200"
        : "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-200";
  return (
    <Link to={to} className={`block rounded-lg border p-4 transition-colors ${cls}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}
