import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Priority = "basse" | "normale" | "haute" | "urgente";
type Status = "a_faire" | "en_cours" | "en_attente" | "terminee";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  created_at: string;
};

type Admin = { user_id: string; display_name: string | null; email: string | null };

const PRIORITY_LABEL: Record<Priority, string> = {
  basse: "Basse", normale: "Normale", haute: "Haute", urgente: "Urgente",
};
const PRIORITY_CLASS: Record<Priority, string> = {
  basse: "bg-slate-100 text-slate-700 border-slate-200",
  normale: "bg-blue-100 text-blue-700 border-blue-200",
  haute: "bg-orange-100 text-orange-700 border-orange-200",
  urgente: "bg-red-100 text-red-700 border-red-200",
};
const STATUS_LABEL: Record<Status, string> = {
  a_faire: "À faire", en_cours: "En cours", en_attente: "En attente", terminee: "Terminée",
};
const STATUS_CLASS: Record<Status, string> = {
  a_faire: "bg-slate-100 text-slate-700 border-slate-200",
  en_cours: "bg-amber-100 text-amber-700 border-amber-200",
  en_attente: "bg-purple-100 text-purple-700 border-purple-200",
  terminee: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fStatus, setFStatus] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");
  const [fAssignee, setFAssignee] = useState<string>("all");

  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", due_date: "",
    priority: "normale" as Priority, status: "a_faire" as Status,
  });

  const loadAll = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([
      supabase.from("admin_tasks").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_admins"),
    ]);
    if (t.error) toast({ title: "Erreur", description: t.error.message, variant: "destructive" });
    else setTasks((t.data ?? []) as Task[]);
    if (!a.error) setAdmins((a.data ?? []) as Admin[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const adminMap = useMemo(() => {
    const m = new Map<string, Admin>();
    admins.forEach((u) => m.set(u.user_id, u));
    return m;
  }, [admins]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (fStatus !== "all" && t.status !== fStatus) return false;
    if (fPriority !== "all" && t.priority !== fPriority) return false;
    if (fAssignee !== "all" && t.assigned_to !== fAssignee) return false;
    return true;
  }), [tasks, fStatus, fPriority, fAssignee]);

  const createTask = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("admin_tasks").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigned_to: form.assigned_to || null,
      created_by: userRes.user?.id ?? null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Tâche créée" });
    setOpen(false);
    setForm({ title: "", description: "", assigned_to: "", due_date: "", priority: "normale", status: "a_faire" });
    loadAll();
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("admin_tasks").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const labelFor = (uid: string | null) => {
    if (!uid) return "Non assigné";
    const u = adminMap.get(uid);
    return u?.display_name || u?.email || "Inconnu";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold">Tâches</h1>
          <p className="text-muted-foreground text-sm">Gestion interne des tâches administratives</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Nouvelle tâche
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px]">
          <Label className="text-xs">Statut</Label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Label className="text-xs">Priorité</Label>
          <Select value={fPriority} onValueChange={setFPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px]">
          <Label className="text-xs">Assigné à</Label>
          <Select value={fAssignee} onValueChange={setFAssignee}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {admins.map((a) => (
                <SelectItem key={a.user_id} value={a.user_id}>
                  {a.display_name || a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Aucune tâche</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4 space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug">{t.title}</h3>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Supprimer la tâche"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {t.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={PRIORITY_CLASS[t.priority]}>
                  {PRIORITY_LABEL[t.priority]}
                </Badge>
                <Badge variant="outline" className={STATUS_CLASS[t.status]}>
                  {STATUS_LABEL[t.status]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mt-auto">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> {labelFor(t.assigned_to)}
                </div>
                {t.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(t.due_date).toLocaleDateString("fr-BE")}
                  </div>
                )}
              </div>
              <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as Status)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigné à</Label>
                <Select
                  value={form.assigned_to || "none"}
                  onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {admins.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {a.display_name || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Échéance</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={createTask} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
