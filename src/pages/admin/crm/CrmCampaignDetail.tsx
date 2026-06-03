import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addContactsToCampaign,
  bulkMarkCampaignContacted,
  getCampaign,
  listCampaignContacts,
  listContacts,
  updateCampaignContactStatus,
  upsertCampaign,
} from "@/modules/crm/api";
import {
  CAMPAIGN_STATUS_LABELS,
  CHANNEL_LABELS,
  type CrmCampaign,
  type CrmCampaignContact,
  type CrmCampaignContactStatus,
  type CrmContact,
} from "@/modules/crm/types";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";
import { ArrowLeft, Plus, Send } from "lucide-react";

const CC_STATUS_LABELS: Record<CrmCampaignContactStatus, string> = {
  cible: "Ciblé",
  contacte: "Contacté",
  repondu: "Répondu",
  converti: "Converti",
};

export default function CrmCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CrmCampaign | null>(null);
  const [ccs, setCcs] = useState<CrmCampaignContact[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const reload = async () => {
    if (!id) return;
    const [c, cc, ct] = await Promise.all([getCampaign(id), listCampaignContacts(id), listContacts()]);
    setCampaign(c);
    setCcs(cc);
    setContacts(ct);
  };
  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, [id]);

  const contactsById = useMemo(() => {
    const m = new Map<string, CrmContact>();
    contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contacts]);

  const stats = useMemo(() => ({
    cible: ccs.filter((c) => c.status === "cible").length,
    contacte: ccs.filter((c) => c.status === "contacte").length,
    repondu: ccs.filter((c) => c.status === "repondu").length,
    converti: ccs.filter((c) => c.status === "converti").length,
  }), [ccs]);

  const existingIds = useMemo(() => new Set(ccs.map((c) => c.contact_id)), [ccs]);
  const available = useMemo(() => contacts.filter((c) => !existingIds.has(c.id)), [contacts, existingIds]);

  if (!campaign) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;

  const handleAdd = async () => {
    try {
      await addContactsToCampaign(campaign.id, Array.from(selectedToAdd));
      const newCount = (campaign.target_contacts ?? 0) + selectedToAdd.size;
      await upsertCampaign({ ...campaign, target_contacts: newCount });
      toast.success(`${selectedToAdd.size} contact(s) ajouté(s)`);
      setSelectedToAdd(new Set());
      setAddOpen(false);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkAll = async () => {
    if (!confirm("Marquer tous les contacts comme contactés et créer une interaction ?")) return;
    try {
      await bulkMarkCampaignContacted(campaign.id, ccs.map((c) => c.contact_id), campaign.name, user?.id ?? "");
      await upsertCampaign({ ...campaign, results_contacts_reached: ccs.length });
      toast.success("Tous marqués comme contactés");
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const updateResults = async (patch: Partial<CrmCampaign>) => {
    try {
      await upsertCampaign({ ...campaign, ...patch });
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/admin/crm/campagnes"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-2xl">{campaign.name}</h1>
        <Badge variant="outline">{CHANNEL_LABELS[campaign.channel]}</Badge>
        <Badge variant="outline">{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
      </div>

      {campaign.objective && <p className="text-sm text-muted-foreground">{campaign.objective}</p>}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatBox label="Ciblés" value={stats.cible} />
        <StatBox label="Contactés" value={stats.contacte} />
        <StatBox label="Répondu" value={stats.repondu} />
        <StatBox label="Convertis" value={stats.converti} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Contacts ({ccs.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleMarkAll} disabled={ccs.length === 0}>
              <Send className="h-4 w-4" /> Marquer tous comme Contactés
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {ccs.length === 0 ? <p className="text-sm text-muted-foreground">Aucun contact dans cette campagne.</p> : (
            <ul className="divide-y">
              {ccs.map((cc) => {
                const contact = contactsById.get(cc.contact_id);
                return (
                  <li key={cc.id} className="flex items-center gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      {contact ? (
                        <Link to={`/admin/crm/contacts/${contact.id}`} className="font-medium hover:underline">{contact.name}</Link>
                      ) : <span className="text-muted-foreground">Contact supprimé</span>}
                      {contact?.city && <span className="text-xs text-muted-foreground ml-2">{contact.city}</span>}
                    </div>
                    <Select value={cc.status} onValueChange={(v) => updateCampaignContactStatus(cc.id, v as any).then(reload)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CC_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Résultats</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Contacts touchés</Label>
            <Input type="number" value={campaign.results_contacts_reached} onChange={(e) => updateResults({ results_contacts_reached: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Réponses positives</Label>
            <Input type="number" value={campaign.results_positive_responses} onChange={(e) => updateResults({ results_positive_responses: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Nouveaux partenaires</Label>
            <Input type="number" value={campaign.results_new_partners} onChange={(e) => updateResults({ results_new_partners: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Ajouter des contacts</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{selectedToAdd.size} sélectionné(s)</p>
          <ul className="divide-y border rounded">
            {available.length === 0 ? <li className="p-4 text-sm text-muted-foreground">Tous les contacts sont déjà dans la campagne.</li> :
              available.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-2 hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={selectedToAdd.has(c.id)}
                    onChange={(e) => {
                      const n = new Set(selectedToAdd);
                      if (e.target.checked) n.add(c.id); else n.delete(c.id);
                      setSelectedToAdd(n);
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.city} · {c.status}</div>
                  </div>
                </li>
              ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={selectedToAdd.size === 0}>Ajouter ({selectedToAdd.size})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </CardContent></Card>
  );
}
