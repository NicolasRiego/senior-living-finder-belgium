import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createInteraction,
  deleteTask,
  getContact,
  getGroup,
  listAdmins,
  listInteractions,
  listTasks,
  upsertContact,
  upsertTask,
} from "@/modules/crm/api";
import {
  INTERACTION_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type CrmContact,
  type CrmGroup,
  type CrmInteraction,
  type CrmTask,
} from "@/modules/crm/types";
import { StatusBadge, formatDate } from "@/modules/crm/ui";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";
import { Plus, Trash2, Building2, ArrowLeft, Mail } from "lucide-react";
import { MessageComposerDialog } from "@/modules/crm/MessageComposerDialog";


export default function CrmContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contact, setContact] = useState<CrmContact | null>(null);
  const [group, setGroup] = useState<CrmGroup | null>(null);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [admins, setAdmins] = useState<Array<{ user_id: string; display_name: string | null }>>([]);
  const [newInteraction, setNewInteraction] = useState<Partial<CrmInteraction> | null>(null);
  const [newTask, setNewTask] = useState<Partial<CrmTask> | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);


  const reload = async () => {
    if (!id) return;
    const [c, i, t, a] = await Promise.all([getContact(id), listInteractions(id), listTasks({ contact_id: id }), listAdmins()]);
    setContact(c);
    setInteractions(i);
    setTasks(t);
    setAdmins(a);
    if (c?.group_id) setGroup(await getGroup(c.group_id));
    else setGroup(null);
  };

  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, [id]);

  if (!contact) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;

  const updateField = async (patch: Partial<CrmContact>) => {
    try {
      await upsertContact({ ...contact, ...patch });
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const addInteraction = async () => {
    if (!newInteraction?.summary || !newInteraction.type) return toast.error("Type et résumé requis");
    try {
      await createInteraction({
        contact_id: contact.id,
        type: newInteraction.type,
        summary: newInteraction.summary,
        date: newInteraction.date || new Date().toISOString(),
        result: newInteraction.result || null,
        created_by: user?.id ?? null,
      });
      toast.success("Interaction ajoutée");
      setNewInteraction(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const addTask = async () => {
    if (!newTask?.title) return toast.error("Titre requis");
    try {
      await upsertTask({
        contact_id: contact.id,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        priority: newTask.priority || "normale",
        assigned_to: newTask.assigned_to || user?.id || null,
        status: "a_faire",
        created_by: user?.id ?? null,
      });
      toast.success("Tâche créée");
      setNewTask(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleTask = async (t: CrmTask) => {
    try {
      await upsertTask({ ...t, status: t.status === "termine" ? "a_faire" : "termine" });
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/admin/crm/contacts"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-2xl">{contact.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <InlineField label="Nom" value={contact.name} onSave={(v) => updateField({ name: v })} />
                <InlineField label="Email" value={contact.email} onSave={(v) => updateField({ email: v })} />
                <InlineField label="Téléphone" value={contact.phone} onSave={(v) => updateField({ phone: v })} />
                <InlineField label="Site web" value={contact.website} onSave={(v) => updateField({ website: v })} />
                <InlineField label="Adresse" value={contact.address} onSave={(v) => updateField({ address: v })} />
                <InlineField label="Ville" value={contact.city} onSave={(v) => updateField({ city: v })} />
                <InlineField label="Prénom contact" value={contact.contact_firstname} onSave={(v) => updateField({ contact_firstname: v })} />
                <InlineField label="Nom contact" value={contact.contact_lastname} onSave={(v) => updateField({ contact_lastname: v })} />
                <InlineField label="Rôle" value={contact.contact_role} onSave={(v) => updateField({ contact_role: v })} />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Statut</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateField({ status: s })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        contact.status === s ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Interactions</CardTitle>
              <Button size="sm" onClick={() => setNewInteraction({ type: "note", date: new Date().toISOString().slice(0, 16) })}>
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>
              ) : (
                <ul className="space-y-3">
                  {interactions.map((i) => (
                    <li key={i.id} className="border-l-2 border-primary/40 pl-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{INTERACTION_LABELS[i.type]}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(i.date)}</span>
                        {i.result && (
                          <Badge variant="outline" className={
                            i.result === "positif" ? "bg-green-100 text-green-800" :
                            i.result === "negatif" ? "bg-red-100 text-red-800" : "bg-muted"
                          }>{i.result}</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{i.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT 1/3 */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Gestion</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Admin assigné</Label>
                <Select value={contact.assigned_to ?? ""} onValueChange={(v) => updateField({ assigned_to: v || null })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name || a.user_id.slice(0, 6)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prochaine relance</Label>
                <Input
                  type="date"
                  value={contact.next_followup_date ?? ""}
                  onChange={(e) => updateField({ next_followup_date: e.target.value || null })}
                />
              </div>
              <Button onClick={() => setComposerOpen(true)} className="w-full bg-primary hover:bg-primary/90">
                <Mail className="h-4 w-4" /> Rédiger un message
              </Button>

                <Link to={`/admin/residences`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> Voir la fiche SilverPlace →
                </Link>
              )}
              {group && (
                <div className="text-sm">
                  Appartient au groupe :{" "}
                  <Link to={`/admin/crm/groupes/${group.id}`} className="text-primary hover:underline">{group.name}</Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tâches</CardTitle>
              <Button size="sm" onClick={() => setNewTask({ priority: "normale" })}><Plus className="h-4 w-4" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune tâche.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 rounded border p-2">
                      <input type="checkbox" checked={t.status === "termine"} onChange={() => toggleTask(t)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${t.status === "termine" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
                          {t.due_date && <span className="text-xs text-muted-foreground">{formatDate(t.due_date)}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id).then(reload)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New interaction dialog */}
      <Dialog open={!!newInteraction} onOpenChange={(o) => !o && setNewInteraction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle interaction</DialogTitle></DialogHeader>
          {newInteraction && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={newInteraction.type} onValueChange={(v) => setNewInteraction({ ...newInteraction, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="datetime-local" value={newInteraction.date?.slice(0, 16) ?? ""} onChange={(e) => setNewInteraction({ ...newInteraction, date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Résumé</Label>
                <Textarea value={newInteraction.summary ?? ""} onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Résultat</Label>
                <Select value={newInteraction.result ?? "none"} onValueChange={(v) => setNewInteraction({ ...newInteraction, result: v === "none" ? null : (v as any) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="positif">Positif</SelectItem>
                    <SelectItem value="neutre">Neutre</SelectItem>
                    <SelectItem value="negatif">Négatif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewInteraction(null)}>Annuler</Button>
            <Button onClick={addInteraction}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New task dialog */}
      <Dialog open={!!newTask} onOpenChange={(o) => !o && setNewTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
          {newTask && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Titre</Label>
                <Input value={newTask.title ?? ""} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={newTask.description ?? ""} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Échéance</Label>
                  <Input type="date" value={newTask.due_date ?? ""} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Priorité</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Assigné à</Label>
                <Select value={newTask.assigned_to ?? user?.id ?? ""} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name || a.user_id.slice(0, 6)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTask(null)}>Annuler</Button>
            <Button onClick={addTask}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InlineField({ label, value, onSave }: { label: string; value: string | null; onSave: (v: string | null) => void }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if ((value ?? "") !== v) onSave(v || null); }}
      />
    </div>
  );
}
