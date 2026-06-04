import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/AuthProvider";
import { deleteTemplate, listTemplates, upsertTemplate } from "@/modules/crm/api";
import {
  MESSAGE_LANG_LABELS,
  MESSAGE_TONE_LABELS,
  MESSAGE_TYPE_LABELS,
  type CrmTemplate,
} from "@/modules/crm/types";

export default function CrmTemplates() {
  const { user } = useAuth();
  const [items, setItems] = useState<CrmTemplate[]>([]);
  const [editing, setEditing] = useState<Partial<CrmTemplate> | null>(null);

  const reload = () => listTemplates().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.message_type) return toast.error("Nom et type requis");
    try {
      await upsertTemplate({
        ...(editing as any),
        created_by: editing.created_by ?? user?.id ?? null,
      });
      toast.success("Template enregistré");
      setEditing(null);
      reload();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce template ?")) return;
    try { await deleteTemplate(id); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Templates de messages</h1>
        <Button onClick={() => setEditing({ name: "", message_type: "premier_contact", language: "fr", tone: "professionnel", extra_instructions: "" })}>
          <Plus className="h-4 w-4" /> Nouveau template
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun template. Créez-en un pour gagner du temps lors de la rédaction.</p>
        )}
        {items.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {t.name} {t.is_default && <Badge variant="outline">Par défaut</Badge>}
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary">{MESSAGE_TYPE_LABELS[t.message_type as keyof typeof MESSAGE_TYPE_LABELS] ?? t.message_type}</Badge>
                  <Badge variant="outline">{MESSAGE_LANG_LABELS[t.language as keyof typeof MESSAGE_LANG_LABELS] ?? t.language}</Badge>
                  <Badge variant="outline">{MESSAGE_TONE_LABELS[t.tone as keyof typeof MESSAGE_TONE_LABELS] ?? t.tone}</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </div>
            </CardHeader>
            {t.extra_instructions && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.extra_instructions}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier le template" : "Nouveau template"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nom</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={editing.message_type as string} onValueChange={(v) => setEditing({ ...editing, message_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Langue</Label>
                  <Select value={editing.language as string} onValueChange={(v) => setEditing({ ...editing, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_LANG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ton</Label>
                  <Select value={editing.tone as string} onValueChange={(v) => setEditing({ ...editing, tone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_TONE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Instructions additionnelles</Label>
                <Textarea
                  rows={4}
                  value={editing.extra_instructions ?? ""}
                  onChange={(e) => setEditing({ ...editing, extra_instructions: e.target.value })}
                />
              </div>
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
