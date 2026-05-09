import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { Trash2, Plus, Save, Check } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("unit_types").select("*").eq("residence_id", residence.id).order("created_at");
    setUnits((data ?? []) as any);
    setIsDirty(false);
    setLoading(false);
  };

  useEffect(() => { load(); }, [residence.id]);

  const refreshCapacity = async () => {
    const { data } = await supabase
      .from("unit_types")
      .select("count_total")
      .eq("residence_id", residence.id);
    const total = (data ?? []).reduce((sum, u) => sum + (u.count_total ?? 0), 0);
    await supabase.from("residences").update({ capacity: total }).eq("id", residence.id);
    onChange({ capacity: total });
  };

  useAutosave(units, async (list) => {
    setExternalSaving("saving");
    for (const u of list) {
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
      if (error) { setExternalSaving("error"); throw error; }
    }
    setExternalSaving("saved");
    await refreshCapacity();
  }, { enabled: units.length > 0 });

  const addUnit = async () => {
    const { data, error } = await supabase.from("unit_types").insert({
      residence_id: residence.id, type: "Studio", count_total: 1, available_count: 0,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setUnits((u) => [...u, data as any]);
    await refreshCapacity();
  };

  const removeUnit = async (id: string) => {
    const { error } = await supabase.from("unit_types").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setUnits((u) => u.filter((x) => x.id !== id));
    await refreshCapacity();
  };

  const update = (id: string, patch: Partial<UnitType>) => {
    setIsDirty(true);
    setUnits((u) => u.map((x) => x.id === id ? { ...x, ...patch } : x));
  };

  const saveAll = async () => {
    setSaving(true);
    setExternalSaving("saving");
    try {
      for (const u of units) {
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
      }
      await refreshCapacity();
      setExternalSaving("saved");
      setIsDirty(false);
      toast.success("Logements enregistrés. La capacité a été mise à jour.");
    } catch (e: any) {
      toast.error(e.message);
      setExternalSaving("error");
    } finally {
      setSaving(false);
    }
  };

  const buttonLabel = saving
    ? "Enregistrement en cours…"
    : isDirty
      ? "Enregistrer les modifications"
      : "Tout est enregistré";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 3 — Logements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-muted-foreground">Chargement…</p> : (
          <>
            {units.map((u) => (
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
                    <Button variant="ghost" size="icon" onClick={() => removeUnit(u.id)} aria-label="Supprimer">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {units.length > 0 && (
              <Button
                onClick={saveAll}
                disabled={saving || !isDirty}
                variant={isDirty ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <Save className="h-5 w-5 mr-2 animate-pulse" />
                ) : isDirty ? (
                  <Save className="h-5 w-5 mr-2" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                {buttonLabel}
              </Button>
            )}

            <Button variant="outline" size="lg" onClick={addUnit} className="w-full">
              <Plus className="h-5 w-5 mr-2" /> Ajouter un type de logement
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
