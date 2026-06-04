import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  STATUS_COLORS,
  SOURCE_LABELS,
  type CrmContact,
  type CrmContactStatus,
  type CrmContactType,
  type CrmGroup,
} from "@/modules/crm/types";
import {
  deleteContact,
  deleteGroup,
  listAdmins,
  listContacts,
  listGroups,
  listInteractions,
  upsertContact,
  upsertGroup,
} from "@/modules/crm/api";
import { StatusBadge, daysSince, formatDate } from "@/modules/crm/ui";
import { toast } from "sonner";
import { Eye, Pencil, Trash2, Search, Plus, Building2, Home, Network, Globe, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";

const STATUS_BORDER: Record<CrmContactStatus, string> = {
  a_contacter: "border-l-muted-foreground/40",
  contacte: "border-l-blue-500",
  en_discussion: "border-l-orange-500",
  demo_envoyee: "border-l-purple-500",
  partenaire: "border-l-green-500",
  refus: "border-l-red-500",
};

export default function CrmContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [groups, setGroups] = useState<CrmGroup[]>([]);
  const [admins, setAdmins] = useState<Array<{ user_id: string; display_name: string | null }>>([]);
  const [lastByGroup, setLastByGroup] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"groupes" | "residences" | "organigramme">("groupes");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<CrmContact> | null>(null);
  const [editingGroup, setEditingGroup] = useState<Partial<CrmGroup> | null>(null);
  const [zoom, setZoom] = useState(1);

  const reload = async () => {
    const [c, g, a, ix] = await Promise.all([
      listContacts(),
      listGroups(),
      listAdmins(),
      listInteractions(undefined, 500).catch(() => []),
    ]);
    setContacts(c);
    setGroups(g);
    setAdmins(a);
    const contactGroup = new Map(c.map((x) => [x.id, x.group_id]));
    const map: Record<string, string> = {};
    for (const i of ix) {
      const gid = contactGroup.get(i.contact_id);
      if (!gid) continue;
      if (!map[gid] || i.date > map[gid]) map[gid] = i.date;
    }
    setLastByGroup(map);
  };

  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, []);

  const adminById = useMemo(() => Object.fromEntries(admins.map((a) => [a.user_id, a])), [admins]);
  const groupById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  // Enrich groups with stats
  const groupStats = useMemo(() => {
    return groups.map((g) => {
      // exclude the "head" contact (where contact.id matches no residence — heuristic: name equals group name)
      const linkedContacts = contacts.filter((c) => c.group_id === g.id);
      const residences = linkedContacts.filter((c) => c.type === "residence_independante");
      const onSilverplace = linkedContacts.filter((c) => c.residence_id).length;
      const head = linkedContacts.find((c) => c.type === "groupe");
      return {
        group: g,
        residencesCount: residences.length,
        silverplaceCount: onSilverplace,
        status: head?.status ?? ("a_contacter" as CrmContactStatus),
        assignedTo: head?.assigned_to ?? null,
        headId: head?.id ?? null,
        lastInteraction: lastByGroup[g.id] ?? null,
      };
    });
  }, [groups, contacts, lastByGroup]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groupStats.filter((gs) => {
      if (statusFilter !== "all" && gs.status !== statusFilter) return false;
      if (adminFilter !== "all" && gs.assignedTo !== adminFilter) return false;
      if (q && !gs.group.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [groupStats, search, statusFilter, adminFilter]);

  const residencesAll = useMemo(
    () => contacts.filter((c) => c.type === "residence_independante"),
    [contacts],
  );

  const filteredResidences = useMemo(() => {
    const q = search.trim().toLowerCase();
    return residencesAll.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (adminFilter !== "all" && c.assigned_to !== adminFilter) return false;
      if (q) {
        const grp = c.group_id ? groupById[c.group_id]?.name ?? "" : "";
        const hay = `${c.name} ${c.email ?? ""} ${c.city ?? ""} ${grp}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [residencesAll, search, statusFilter, adminFilter, groupById]);

  const save = async () => {
    if (!editing?.name) return toast.error("Le nom est requis");
    try {
      await upsertContact(editing as any);
      toast.success("Contact enregistré");
      setEditing(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const saveGroup = async () => {
    if (!editingGroup?.name) return toast.error("Le nom est requis");
    try {
      await upsertGroup(editingGroup as any);
      toast.success("Groupe enregistré");
      setEditingGroup(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce contact ?")) return;
    try { await deleteContact(id); toast.success("Supprimé"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const removeGroup = async (id: string) => {
    if (!confirm("Supprimer ce groupe ? Les résidences liées ne seront pas supprimées.")) return;
    try { await deleteGroup(id); toast.success("Groupe supprimé"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-3xl">Contacts & Groupes</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditing({ type: "residence_independante", status: "a_contacter", source: "liste_interne" })}>
            <Plus className="h-4 w-4" /> Nouveau contact
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditingGroup({})}>
            <Plus className="h-4 w-4" /> Nouveau groupe
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="h-auto">
          <TabsTrigger value="groupes" className="gap-2">
            <Building2 className="h-4 w-4" /> Groupes ({groups.length})
          </TabsTrigger>
          <TabsTrigger value="residences" className="gap-2">
            <Home className="h-4 w-4" /> Résidences ({residencesAll.length})
          </TabsTrigger>
          <TabsTrigger value="organigramme" className="gap-2">
            <Network className="h-4 w-4" /> Organigramme
          </TabsTrigger>
        </TabsList>

        {tab !== "organigramme" && (
          <Card className="p-4 mt-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={tab === "groupes" ? "Rechercher un groupe…" : "Rechercher une résidence (nom, ville, groupe)…"}
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
              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Admin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les admins</SelectItem>
                  {admins.map((a) => (
                    <SelectItem key={a.user_id} value={a.user_id}>{a.display_name || a.user_id.slice(0, 6)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* ===== Groupes ===== */}
        <TabsContent value="groupes" className="mt-3 space-y-3">
          {filteredGroups.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Aucun groupe</Card>
          ) : (
            filteredGroups.map((gs) => {
              const since = daysSince(gs.lastInteraction);
              const admin = gs.assignedTo ? adminById[gs.assignedTo] : null;
              const initials = (admin?.display_name ?? "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
              return (
                <Card
                  key={gs.group.id}
                  className={`border-l-4 ${STATUS_BORDER[gs.status]} transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                  style={{ minHeight: 120 }}
                  onClick={() => navigate(`/admin/crm/groupes/${gs.group.id}`)}
                >
                  <div className="p-5 flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-xl font-semibold">{gs.group.name}</h3>
                        <StatusBadge status={gs.status} />
                      </div>
                      {gs.group.website && (
                        <a
                          href={gs.group.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          {gs.group.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      {gs.group.sector && (
                        <div className="mt-1 text-xs text-muted-foreground">{gs.group.sector}</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-sm min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{gs.residencesCount}</span>
                        <span className="text-muted-foreground">résidences</span>
                      </div>
                      <div className={`flex items-center gap-2 font-medium ${gs.silverplaceCount > 0 ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                        <span className="h-2 w-2 rounded-full" style={{ background: gs.silverplaceCount > 0 ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))" }} />
                        {gs.silverplaceCount} sur SilverPlace
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 min-w-[180px]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {admin ? (
                          <>
                            <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials}</AvatarFallback></Avatar>
                            <span>{admin.display_name || "—"}</span>
                          </>
                        ) : (
                          <span>Non assigné</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {since !== null ? `Dernière interaction : il y a ${since}j` : "Aucune interaction"}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button asChild variant="ghost" size="icon"><Link to={`/admin/crm/groupes/${gs.group.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingGroup(gs.group)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => removeGroup(gs.group.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ===== Résidences ===== */}
        <TabsContent value="residences" className="mt-3">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Résidence</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernier contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidences.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune résidence</TableCell></TableRow>
                ) : (
                  filteredResidences.map((c) => {
                    const since = daysSince(c.updated_at);
                    const g = c.group_id ? groupById[c.group_id] : null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link to={`/admin/crm/contacts/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                          <div className="text-xs text-muted-foreground">{c.city || "—"}</div>
                        </TableCell>
                        <TableCell>
                          {g ? (
                            <Link to={`/admin/crm/groupes/${g.id}`}>
                              <Badge variant="outline" className="border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200">
                                {g.name}
                              </Badge>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">Résidence</Badge>
                          )}
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
                        <TableCell className="text-sm">{since !== null ? `Il y a ${since}j` : "—"}</TableCell>
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
        </TabsContent>

        {/* ===== Organigramme ===== */}
        <TabsContent value="organigramme" className="mt-3 space-y-3">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" /> Sur SilverPlace</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Dans le CRM</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-muted-foreground/50" /> Non importé</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
          <Card className="p-6 overflow-auto">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s" }}>
              <OrgChart groups={groupStats} contacts={contacts} onNodeClick={(c) => navigate(`/admin/crm/contacts/${c.id}`)} onGroupClick={(g) => navigate(`/admin/crm/groupes/${g.id}`)} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

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

// ===== Organigramme tree =====
type GroupStat = {
  group: CrmGroup;
  residencesCount: number;
  silverplaceCount: number;
  status: CrmContactStatus;
};

function OrgChart({
  groups,
  contacts,
  onNodeClick,
  onGroupClick,
}: {
  groups: GroupStat[];
  contacts: CrmContact[];
  onNodeClick: (c: CrmContact) => void;
  onGroupClick: (g: CrmGroup) => void;
}) {
  return (
    <div className="flex gap-6 items-start min-w-max">
      {groups.map((gs) => {
        const residences = contacts.filter((c) => c.group_id === gs.group.id && c.type === "residence_independante");
        const groupColor =
          gs.silverplaceCount > 0
            ? "bg-green-100 border-green-500 text-green-900 dark:bg-green-900/30 dark:text-green-100"
            : gs.residencesCount > 0
              ? "bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
              : "bg-muted border-muted-foreground/30 text-muted-foreground";
        return (
          <div key={gs.group.id} className="flex flex-col items-center" style={{ minWidth: 200 }}>
            <button
              onClick={() => onGroupClick(gs.group)}
              className={`rounded-lg border-2 px-4 py-3 text-center font-semibold shadow-sm hover:shadow-md transition-shadow ${groupColor}`}
              style={{ minWidth: 180 }}
            >
              <div>{gs.group.name}</div>
              <div className="text-xs font-normal opacity-80 mt-0.5">{gs.residencesCount} résidence{gs.residencesCount > 1 ? "s" : ""}</div>
            </button>
            {residences.length > 0 && (
              <>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-col gap-1.5 items-stretch w-full">
                  {residences.map((r) => {
                    const color = r.residence_id
                      ? "bg-green-50 border-green-400 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                      : "bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100";
                    return (
                      <button
                        key={r.id}
                        onClick={() => onNodeClick(r)}
                        className={`rounded border px-2.5 py-1.5 text-xs text-left hover:shadow-sm transition-shadow ${color}`}
                      >
                        <div className="font-medium truncate">{r.name}</div>
                        {r.city && <div className="opacity-70 truncate">{r.city}</div>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
