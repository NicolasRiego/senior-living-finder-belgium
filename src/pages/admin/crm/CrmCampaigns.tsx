import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteCampaign,
  listCampaigns,
  upsertCampaign,
} from "@/modules/crm/api";
import {
  CAMPAIGN_STATUS_LABELS,
  CHANNEL_LABELS,
  type CrmCampaign,
} from "@/modules/crm/types";
import { formatDate } from "@/modules/crm/ui";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Mail, Linkedin, Phone, Calendar } from "lucide-react";

const CHANNEL_ICON = { email: Mail, linkedin: Linkedin, telephone: Phone, evenement: Calendar, autre: Calendar };

const STATUS_COLORS_CAMPAIGN: Record<string, string> = {
  planifiee: "bg-muted text-muted-foreground",
  en_cours: "bg-orange-100 text-orange-800",
  terminee: "bg-green-100 text-green-800",
};

export default function CrmCampaigns() {
  const [items, setItems] = useState<CrmCampaign[]>([]);
  const [editing, setEditing] = useState<Partial<CrmCampaign> | null>(null);

  const reload = async () => setItems(await listCampaigns());
  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error("Nom requis");
    try {
      await upsertCampaign(editing as any);
      toast.success("Enregistré");
      setEditing(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    await deleteCampaign(id);
    toast.success("Supprimée");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Campagnes</h1>
        <Button onClick={() => setEditing({ channel: "email", status: "planifiee", target_contacts: 0, results_contacts_reached: 0, results_positive_responses: 0, results_new_partners: 0 })}>
          <Plus className="h-4 w-4" /> Nouvelle campagne
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && <p className="text-muted-foreground">Aucune campagne.</p>}
        {items.map((c) => {
          const Icon = CHANNEL_ICON[c.channel];
          return (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <h3 className="font-semibold truncate">{c.name}</h3>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS_CAMPAIGN[c.status]}>
                    {CAMPAIGN_STATUS_LABELS[c.status]}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Du {formatDate(c.start_date)} au {formatDate(c.end_date)}
                </div>
                <div className="text-sm">
                  {c.results_contacts_reached} touchés / {c.target_contacts} ciblés
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.results_positive_responses} réponses positives · {c.results_new_partners} nouveaux partenaires
                </div>
                <div className="flex gap-1 pt-2 border-t">
                  <Button asChild variant="ghost" size="sm"><Link to={`/admin/crm/campagnes/${c.id}`}><Eye className="h-3 w-3" /> Voir</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(c)}><Pencil className="h-3 w-3" /> Éditer</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label className="text-xs">Nom *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label className="text-xs">Objectif</Label><Textarea value={editing.objective ?? ""} onChange={(e) => setEditing({ ...editing, objective: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Canal</Label>
                  <Select value={editing.channel} onValueChange={(v) => setEditing({ ...editing, channel: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Statut</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Début</Label><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value || null })} /></div>
                <div><Label className="text-xs">Fin</Label><Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })} /></div>
                <div><Label className="text-xs">Cibles</Label><Input type="number" value={editing.target_contacts ?? 0} onChange={(e) => setEditing({ ...editing, target_contacts: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Budget estimé (€)</Label><Input type="number" value={editing.budget_estimated ?? ""} onChange={(e) => setEditing({ ...editing, budget_estimated: e.target.value ? Number(e.target.value) : null })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Pour ajouter des contacts à la campagne, ouvrez la page de détail après création.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
