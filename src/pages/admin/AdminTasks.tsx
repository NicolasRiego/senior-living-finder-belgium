import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, User as UserIcon, Trash2, Pencil, ChevronDown, LayoutGrid, List } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Priority = "basse" | "normale" | "haute" | "urgente";
type Status = "a_faire" | "en_cours" | "en_attente" | "terminee";

type Task = {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  created_at: string;
  assignees: string[];
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

type FormState = {
  title: string;
  description: string;
  assignees: string[];
  due_date: string;
  priority: Priority;
  status: Status;
};

const EMPTY_FORM: FormState = {
  title: "", description: "", assignees: [], due_date: "",
  priority: "normale", status: "a_faire",
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");
  const [fAssignee, setFAssignee] = useState<string>("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [view, setView] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("admin_tasks_view") as "grid" | "list") || "grid";
  });
  useEffect(() => { localStorage.setItem("admin_tasks_view", view); }, [view]);

  const loadAll = async () => {
    setLoading(true);
    const [t, a, links] = await Promise.all([
      supabase.from("admin_tasks").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_admins"),
      supabase.from("admin_task_assignees").select("task_id, user_id"),
    ]);
    if (t.error) toast({ title: "Erreur", description: t.error.message, variant: "destructive" });
    else {
      const byTask = new Map<string, string[]>();
      ((links.data ?? []) as { task_id: string; user_id: string }[]).forEach((l) => {
        const arr = byTask.get(l.task_id) ?? [];
        arr.push(l.user_id);
        byTask.set(l.task_id, arr);
      });
      setTasks((t.data ?? []).map((row: any) => ({
        ...row,
        assignees: byTask.get(row.id) ?? [],
      })) as Task[]);
    }
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
    if (fAssignee !== "all") {
      if (fAssignee === "none" ? t.assignees.length > 0 : !t.assignees.includes(fAssignee)) return false;
    }
    return true;
  }), [tasks, fStatus, fPriority, fAssignee]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      assignees: t.assignees,
      due_date: t.due_date ?? "",
      priority: t.priority,
      status: t.status,
    });
    setOpen(true);
  };

  const syncAssignees = async (taskId: string, assignees: string[]) => {
    await supabase.from("admin_task_assignees").delete().eq("task_id", taskId);
    if (assignees.length > 0) {
      await supabase.from("admin_task_assignees").insert(
        assignees.map((user_id) => ({ task_id: taskId, user_id }))
      );
    }
  };

  const saveTask = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }
    if (editingId) {
      const { error } = await supabase.from("admin_tasks").update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
      }).eq("id", editingId);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      await syncAssignees(editingId, form.assignees);
      toast({ title: "Tâche mise à jour" });
    } else {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("admin_tasks").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        created_by: userRes.user?.id ?? null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
      }).select("id").single();
      if (error || !data) {
        toast({ title: "Erreur", description: error?.message, variant: "destructive" });
        return;
      }
      await syncAssignees(data.id, form.assignees);
      toast({ title: "Tâche créée" });
    }
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
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

  const labelFor = (uid: string) => {
    const u = adminMap.get(uid);
    return u?.display_name || u?.email || "Inconnu";
  };

  const toggleAssignee = (uid: string) => {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(uid)
        ? f.assignees.filter((x) => x !== uid)
        : [...f.assignees, uid],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold">Tâches</h1>
          <p className="text-muted-foreground text-sm">Gestion interne des tâches administratives</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
              <SelectItem value="none">Non assigné</SelectItem>
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
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Modifier la tâche"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer la tâche"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
                <div className="flex items-start gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {t.assignees.length === 0
                      ? "Non assigné"
                      : t.assignees.map(labelFor).join(", ")}
                  </span>
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

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
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
            <div>
              <Label>Assignés</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate text-left">
                      {form.assignees.length === 0
                        ? "Aucun"
                        : form.assignees.length <= 2
                          ? form.assignees.map(labelFor).join(", ")
                          : `${form.assignees.length} assignés`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-2 max-h-72 overflow-y-auto" align="start">
                  {admins.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Aucun admin</p>
                  ) : admins.map((a) => (
                    <label
                      key={a.user_id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={form.assignees.includes(a.user_id)}
                        onCheckedChange={() => toggleAssignee(a.user_id)}
                      />
                      <span className="truncate">{a.display_name || a.email}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="col-span-2">
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
            <Button onClick={saveTask} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {editingId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
