import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  STATUS_LABELS,
  SOURCE_LABELS,
  type CrmContact,
  type CrmContactStatus,
  type CrmContactType,
  type CrmGroup,
} from "@/modules/crm/types";
import {
  deleteContact,
  listAdmins,
  listContacts,
  listGroups,
  upsertContact,
  upsertGroup,
} from "@/modules/crm/api";
import { StatusBadge, TypeBadge, daysSince, formatDate } from "@/modules/crm/ui";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Search, Plus } from "lucide-react";

export default function CrmContacts() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [groups, setGroups] = useState<CrmGroup[]>([]);
  const [admins, setAdmins] = useState<Array<{ user_id: string; display_name: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<CrmContact> | null>(null);
  const [editingGroup, setEditingGroup] = useState<Partial<CrmGroup> | null>(null);

  const reload = async () => {
    const [c, g, a] = await Promise.all([listContacts(), listGroups(), listAdmins()]);
    setContacts(c);
    setGroups(g);
    setAdmins(a);
  };

  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);

  const adminName = (id: string | null) => admins.find((a) => a.user_id === id)?.display_name || "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (adminFilter !== "all" && c.assigned_to !== adminFilter) return false;
      if (q) {
        const hay = `${c.name} ${c.email ?? ""} ${c.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, search, statusFilter, typeFilter, adminFilter]);

  const save = async () => {
    if (!editing?.name) return toast.error("Le nom est requis");
    try {
      await upsertContact(editing as any);
      toast.success("Contact enregistré");
      setEditing(null);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveGroup = async () => {
    if (!editingGroup?.name) return toast.error("Le nom est requis");
    try {
      await upsertGroup(editingGroup as any);
      toast.success("Groupe enregistré");
      setEditingGroup(null);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce contact ?")) return;
    try {
      await deleteContact(id);
      toast.success("Supprimé");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Contacts & Groupes</h1>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="groupe">Groupe</SelectItem>
              <SelectItem value="residence_independante">Indépendant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={adminFilter} onValueChange={setAdminFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Admin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les admins</SelectItem>
              {admins.map((a) => (
                <SelectItem key={a.user_id} value={a.user_id}>{a.display_name || a.user_id.slice(0, 6)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setEditing({ type: "residence_independante", status: "a_contacter", source: "liste_interne" })}>
            <Plus className="h-4 w-4" /> Nouveau contact
          </Button>
          <Button variant="outline" onClick={() => setEditingGroup({})}>
            <Plus className="h-4 w-4" /> Nouveau groupe
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Nom / Ville</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Dernier contact</TableHead>
              <TableHead>Relance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun contact</TableCell></TableRow>
            ) : (
              filtered.map((c) => {
                const since = daysSince(c.updated_at);
                const stale = since !== null && since > 14;
                const todayStr = new Date().toISOString().slice(0, 10);
                const overdue = c.next_followup_date && c.next_followup_date < todayStr;
                return (
                  <TableRow key={c.id}>
                    <TableCell><TypeBadge type={c.type} /></TableCell>
                    <TableCell>
                      <Link to={`/admin/crm/contacts/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                      <div className="text-xs text-muted-foreground">{c.city || "—"}</div>
                    </TableCell>
                    <TableCell>
                      {c.contact_firstname || c.contact_lastname ? (
                        <>
                          <div>{[c.contact_firstname, c.contact_lastname].filter(Boolean).join(" ")}</div>
                          <div className="text-xs text-muted-foreground">{c.contact_role || ""}</div>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm">{adminName(c.assigned_to)}</TableCell>
                    <TableCell className={`text-sm ${stale ? "text-red-600" : ""}`}>
                      {since !== null ? `Il y a ${since}j` : "—"}
                    </TableCell>
                    <TableCell className={`text-sm ${overdue ? "text-orange-600 font-medium" : ""}`}>
                      {formatDate(c.next_followup_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon"><Link to={`/admin/crm/contacts/${c.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Contact editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as CrmContactType, group_id: v === "groupe" ? editing.group_id : null })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residence_independante">Résidence indépendante</SelectItem>
                    <SelectItem value="groupe">Membre d'un groupe</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {editing.type === "groupe" && (
                <Field label="Groupe">
                  <Select value={editing.group_id ?? ""} onValueChange={(v) => setEditing({ ...editing, group_id: v || null })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Nom *" full>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Adresse"><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></Field>
              <Field label="Ville"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
              <Field label="Code postal"><Input value={editing.postal_code ?? ""} onChange={(e) => setEditing({ ...editing, postal_code: e.target.value })} /></Field>
              <Field label="Région"><Input value={editing.region ?? ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} /></Field>
              <Field label="Prénom contact"><Input value={editing.contact_firstname ?? ""} onChange={(e) => setEditing({ ...editing, contact_firstname: e.target.value })} /></Field>
              <Field label="Nom contact"><Input value={editing.contact_lastname ?? ""} onChange={(e) => setEditing({ ...editing, contact_lastname: e.target.value })} /></Field>
              <Field label="Rôle"><Input value={editing.contact_role ?? ""} onChange={(e) => setEditing({ ...editing, contact_role: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
              <Field label="Téléphone"><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <Field label="Site web"><Input value={editing.website ?? ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></Field>
              <Field label="Statut">
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as CrmContactStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Source">
                <Select value={editing.source} onValueChange={(v) => setEditing({ ...editing, source: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Admin assigné">
                <Select value={editing.assigned_to ?? ""} onValueChange={(v) => setEditing({ ...editing, assigned_to: v || null })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name || a.user_id.slice(0, 6)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prochaine relance">
                <Input type="date" value={editing.next_followup_date ?? ""} onChange={(e) => setEditing({ ...editing, next_followup_date: e.target.value || null })} />
              </Field>
              <Field label="Notes" full>
                <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group editor dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(o) => !o && setEditingGroup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingGroup?.id ? "Modifier le groupe" : "Nouveau groupe"}</DialogTitle></DialogHeader>
          {editingGroup && (
            <div className="space-y-3">
              <Field label="Nom *" full><Input value={editingGroup.name ?? ""} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} /></Field>
              <Field label="Logo URL" full><Input value={editingGroup.logo_url ?? ""} onChange={(e) => setEditingGroup({ ...editingGroup, logo_url: e.target.value })} /></Field>
              <Field label="Site web" full><Input value={editingGroup.website ?? ""} onChange={(e) => setEditingGroup({ ...editingGroup, website: e.target.value })} /></Field>
              <Field label="Secteur" full><Input value={editingGroup.sector ?? ""} onChange={(e) => setEditingGroup({ ...editingGroup, sector: e.target.value })} /></Field>
              <Field label="Notes" full><Textarea value={editingGroup.notes ?? ""} onChange={(e) => setEditingGroup({ ...editingGroup, notes: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Annuler</Button>
            <Button onClick={saveGroup}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
