import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { Trash2, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UnitType = {
  id: string;
  type: string;
  count_total: number;
  available_count: number;
  available_now: boolean;
  surface_min: number | null;
  surface_max: number | null;
  waiting_list: boolean;
  waiting_delay_days: number | null;
};

export default function UnitsStep({ residence, setExternalSaving, onChange }: StepProps) {
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("unit_types").select("*").eq("residence_id", residence.id).order("created_at");
    setUnits((data ?? []) as UnitType[]);
    setDirtyIds(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, [residence.id]);

  const recomputeCapacity = async (override?: UnitType[]) => {
    const list = override ?? (await supabase
      .from("unit_types")
      .select("count_total")
      .eq("residence_id", residence.id)).data ?? [];
    const total = list.reduce((sum, x) => sum + (x.count_total ?? 0), 0);
    await supabase.from("residences").update({ capacity: total }).eq("id", residence.id);
    onChange({ capacity: total });
  };

  const addUnit = async () => {
    const { data, error } = await supabase.from("unit_types").insert({
      residence_id: residence.id, type: "Studio", count_total: 1, available_count: 0,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setUnits((u) => [...u, data as UnitType]);
    await recomputeCapacity();
  };

  const removeUnit = async (id: string) => {
    const { error } = await supabase.from("unit_types").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    const remaining = units.filter((x) => x.id !== id);
    setUnits(remaining);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await recomputeCapacity(remaining);
    toast.success("Type de logement supprimé.");
    setConfirmDeleteId(null);
  };

  const update = (id: string, patch: Partial<UnitType>) => {
    setDirtyIds((prev) => new Set(prev).add(id));
    setUnits((u) => u.map((x) => x.id === id ? { ...x, ...patch } : x));
  };

  const saveUnit = async (u: UnitType) => {
    setSavingIds((prev) => new Set(prev).add(u.id));
    setExternalSaving("saving");
    try {
      const { error } = await supabase.from("unit_types").update({
        type: u.type,
        count_total: u.count_total,
        available_count: u.available_count,
        available_now: u.available_now,
        surface_min: u.surface_min,
        surface_max: u.surface_max,
        waiting_list: u.waiting_list,
        waiting_delay_days: u.waiting_delay_days,
      }).eq("id", u.id);
      if (error) throw error;

      await recomputeCapacity();

      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
      setExternalSaving("saved");
      toast.success(`"${u.type}" enregistré. Capacité mise à jour.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement";
      toast.error(msg);
      setExternalSaving("error");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 3 — Logements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-muted-foreground">Chargement…</p> : (
          <>
            {units.map((u) => {
              const isDirty = dirtyIds.has(u.id);
              const isSaving = savingIds.has(u.id);
              return (
                <Card key={u.id} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="grid gap-3 md:grid-cols-2 flex-1">
                        <div className="space-y-2">
                          <Label>Type (Studio, T1, T2…)</Label>
                          <Input value={u.type} onChange={(e) => update(u.id, { type: e.target.value })} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre total</Label>
                          <Input type="number" min="0" value={u.count_total} onChange={(e) => update(u.id, { count_total: Number(e.target.value) })} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Disponibles</Label>
                          <Input type="number" min="0" value={u.available_count} onChange={(e) => update(u.id, { available_count: Number(e.target.value) })} className="h-12" />
                        </div>
                        <div className="space-y-2 flex items-center gap-3 pt-6">
                          <Switch checked={u.available_now} onCheckedChange={(v) => update(u.id, { available_now: v })} />
                          <Label>Disponible immédiatement</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Surface min (m²)</Label>
                          <Input type="number" value={u.surface_min ?? ""} onChange={(e) => update(u.id, { surface_min: e.target.value ? Number(e.target.value) : null })} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Surface max (m²)</Label>
                          <Input type="number" value={u.surface_max ?? ""} onChange={(e) => update(u.id, { surface_max: e.target.value ? Number(e.target.value) : null })} className="h-12" />
                        </div>
                        <div className="space-y-2 flex items-center gap-3 pt-6">
                          <Switch checked={u.waiting_list} onCheckedChange={(v) => update(u.id, { waiting_list: v })} />
                          <Label>Liste d'attente</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Délai d'attente (jours)</Label>
                          <Input type="number" value={u.waiting_delay_days ?? ""} onChange={(e) => update(u.id, { waiting_delay_days: e.target.value ? Number(e.target.value) : null })} className="h-12" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={isDirty ? "default" : "outline"}
                          size="icon"
                          onClick={() => saveUnit(u)}
                          disabled={isSaving || !isDirty}
                          aria-label="Enregistrer ce logement"
                          title={isDirty ? "Enregistrer les modifications" : "Déjà enregistré"}
                        >
                          {isSaving
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <Save className="h-5 w-5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeleteId(u.id)}
                          aria-label="Supprimer ce logement"
                          title="Supprimer ce type de logement"
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button variant="outline" size="lg" onClick={addUnit} className="w-full">
              <Plus className="h-5 w-5 mr-2" /> Ajouter un type de logement
            </Button>
          </>
        )}
      </CardContent>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type de logement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce type de logement.
              La capacité totale de la résidence sera recalculée automatiquement.
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && removeUnit(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
