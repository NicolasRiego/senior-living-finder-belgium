import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/modules/auth/AuthProvider";
import {
  listCampaigns,
  listContacts,
  listInteractions,
  listTasks,
  upsertTask,
} from "@/modules/crm/api";
import type { CrmCampaign, CrmContact, CrmInteraction, CrmTask } from "@/modules/crm/types";
import { INTERACTION_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from "@/modules/crm/types";
import { daysSince, formatDate } from "@/modules/crm/ui";
import { Users, HandshakeIcon, CalendarClock, Megaphone, CheckCircle2, Phone, Mail, Users2, StickyNote } from "lucide-react";
import { toast } from "sonner";

const INTERACTION_ICONS = { appel: Phone, email: Mail, reunion: Users2, note: StickyNote } as const;

export default function CrmDashboard() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);

  const reload = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [c, t, i, cp] = await Promise.all([
      listContacts(),
      user ? listTasks({ assigned_to: user.id, due_before: today }) : Promise.resolve([] as CrmTask[]),
      listInteractions(undefined, 5),
      listCampaigns(),
    ]);
    setContacts(c);
    setTasks(t.filter((x) => x.status !== "termine"));
    setInteractions(i);
    setCampaigns(cp);
  };

  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const partners = contacts.filter((c) => c.status === "partenaire").length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTasks = tasks.filter((t) => t.due_date && t.due_date <= todayStr).length;
    const activeCampaigns = campaigns.filter((c) => c.status === "en_cours").length;
    return { total, partners, todayTasks, activeCampaigns };
  }, [contacts, tasks, campaigns]);

  const contactsById = useMemo(() => {
    const m = new Map<string, CrmContact>();
    contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contacts]);

  const completeTask = async (t: CrmTask) => {
    try {
      await upsertTask({ ...t, status: "termine" });
      toast.success("Tâche terminée");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">CRM — Tableau de bord</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total contacts" value={stats.total} />
        <StatCard icon={<HandshakeIcon className="h-5 w-5" />} label="Partenaires actifs" value={stats.partners} />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Tâches du jour"
          value={stats.todayTasks}
          highlight={stats.todayTasks > 0}
        />
        <StatCard icon={<Megaphone className="h-5 w-5" />} label="Campagnes en cours" value={stats.activeCampaigns} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Mes tâches du jour</CardTitle>
            <Link to="/admin/crm/contacts" className="text-sm text-primary hover:underline">
              Voir toutes mes tâches
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune tâche en attente. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 10).map((t) => {
                  const overdue = t.due_date && t.due_date < new Date().toISOString().slice(0, 10);
                  const contact = t.contact_id ? contactsById.get(t.contact_id) : null;
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={PRIORITY_COLORS[t.priority]} variant="outline">
                            {PRIORITY_LABELS[t.priority]}
                          </Badge>
                          <span className="font-medium">{t.title}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {contact && (
                            <Link to={`/admin/crm/contacts/${contact.id}`} className="hover:underline">
                              {contact.name}
                            </Link>
                          )}
                          {contact && " · "}
                          <span className={overdue ? "text-red-600 font-medium" : ""}>{formatDate(t.due_date)}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => completeTask(t)}>
                        <CheckCircle2 className="h-4 w-4" /> Terminer
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Dernières interactions</CardTitle>
            <Link to="/admin/crm/contacts" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            {interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>
            ) : (
              <ul className="space-y-2">
                {interactions.map((i) => {
                  const contact = contactsById.get(i.contact_id);
                  const Icon = INTERACTION_ICONS[i.type];
                  return (
                    <li key={i.id} className="flex items-start gap-3 rounded-md border p-3">
                      <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{INTERACTION_LABELS[i.type]}</span>
                          <span className="text-muted-foreground">·</span>
                          {contact ? (
                            <Link to={`/admin/crm/contacts/${contact.id}`} className="hover:underline">
                              {contact.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Contact supprimé</span>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">{formatDate(i.date)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{i.summary}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-md p-2 ${highlight ? "bg-red-100 text-red-700" : "bg-primary-soft text-primary"}`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
