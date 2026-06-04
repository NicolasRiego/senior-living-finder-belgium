import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGroup, listContacts, upsertContact, deleteContact } from "@/modules/crm/api";
import type { CrmContact, CrmGroup } from "@/modules/crm/types";
import { StatusBadge } from "@/modules/crm/ui";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Globe, Eye, Pencil, Trash2, Phone, Mail, CheckCircle2, Circle } from "lucide-react";

export default function CrmGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<CrmGroup | null>(null);
  const [residences, setResidences] = useState<CrmContact[]>([]);
  const [allContacts, setAllContacts] = useState<CrmContact[]>([]);
  const [adding, setAdding] = useState(false);
  const [newResidence, setNewResidence] = useState<Partial<CrmContact>>({});
  const [linkExistingId, setLinkExistingId] = useState<string>("");
  const [batchOpen, setBatchOpen] = useState(false);

  const reload = async () => {
    if (!id) return;
    const [g, all] = await Promise.all([getGroup(id), listContacts()]);
    setGroup(g);
    setAllContacts(all);
    setResidences(all.filter((c) => c.group_id === id));
  };
  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, [id]);

  if (!group) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;

  const addNew = async () => {
    if (!newResidence.name) return toast.error("Nom requis");
    try {
      await upsertContact({
        ...newResidence,
        name: newResidence.name,
        group_id: group.id,
        type: "groupe",
        status: "a_contacter",
        source: "liste_interne",
      } as any);
      toast.success("Résidence ajoutée");
      setAdding(false);
      setNewResidence({});
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const linkExisting = async () => {
    if (!linkExistingId) return;
    const c = allContacts.find((x) => x.id === linkExistingId);
    if (!c) return;
    try {
      await upsertContact({ ...c, group_id: group.id, type: "groupe" });
      toast.success("Lié au groupe");
      setLinkExistingId("");
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const hasPartner = residences.some((r) => r.status === "partenaire");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/admin/crm/contacts"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-2xl">{group.name}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Informations du groupe</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {group.sector && <div><span className="text-muted-foreground">Secteur :</span> {group.sector}</div>}
          {group.website && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <a href={group.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{group.website}</a>
            </div>
          )}
          {group.notes && <p className="text-muted-foreground whitespace-pre-line">{group.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Résidences ({residences.length})</CardTitle>
          <div className="flex gap-2">
            {hasPartner && (
              <Button size="sm" variant="outline" onClick={() => setBatchOpen(true)}>
                Attribuer toutes dans SilverPlace
              </Button>
            )}
            <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Ajouter une résidence</Button>
          </div>
        </CardHeader>
        <CardContent>
          {residences.length === 0 ? <p className="text-sm text-muted-foreground">Aucune résidence dans ce groupe.</p> : (
            <ul className="space-y-2">
              {residences.map((r) => {
                const contactName = [r.contact_firstname, r.contact_lastname].filter(Boolean).join(" ");
                const onSilverplace = !!r.residence_id;
                return (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md flex-wrap"
                    style={{ minHeight: 100 }}
                  >
                    <div className="flex-1 min-w-[200px]">
                      <Link to={`/admin/crm/contacts/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                      <div className="text-xs text-muted-foreground">{r.city || "—"}</div>
                      {contactName && (
                        <div className="mt-1 text-sm">
                          {contactName}
                          {r.contact_role && <span className="text-muted-foreground"> — {r.contact_role}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} title={r.phone} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} title={r.email} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={r.status} />
                      {onSilverplace ? (
                        <Badge variant="outline" className="border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sur SilverPlace
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground gap-1">
                          <Circle className="h-3 w-3" /> Non intégré
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="icon"><Link to={`/admin/crm/contacts/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="ghost" size="icon"><Link to={`/admin/crm/contacts/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          if (!confirm(`Supprimer ${r.name} ?`)) return;
                          try { await deleteContact(r.id); toast.success("Supprimé"); reload(); }
                          catch (e: any) { toast.error(e.message); }
                        }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>


      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une résidence au groupe</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 border rounded p-3">
              <p className="text-xs font-semibold">Lier une résidence existante</p>
              <Select value={linkExistingId} onValueChange={setLinkExistingId}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {allContacts.filter((c) => c.group_id !== group.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={linkExisting} disabled={!linkExistingId}>Lier au groupe</Button>
            </div>
            <div className="space-y-3 border rounded p-3">
              <p className="text-xs font-semibold">Ou créer une nouvelle résidence</p>
              <div><Label className="text-xs">Nom</Label><Input value={newResidence.name ?? ""} onChange={(e) => setNewResidence({ ...newResidence, name: e.target.value })} /></div>
              <div><Label className="text-xs">Ville</Label><Input value={newResidence.city ?? ""} onChange={(e) => setNewResidence({ ...newResidence, city: e.target.value })} /></div>
              <div><Label className="text-xs">Email contact</Label><Input value={newResidence.email ?? ""} onChange={(e) => setNewResidence({ ...newResidence, email: e.target.value })} /></div>
              <Button size="sm" onClick={addNew}>Créer</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdding(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Attribution en masse</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action vous redirigera vers la page de gestion des résidences SilverPlace où vous pourrez attribuer chaque résidence individuellement.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>Annuler</Button>
            <Button asChild><Link to="/admin/residences">Ouvrir la gestion</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
