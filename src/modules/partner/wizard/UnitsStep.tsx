import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { Trash2, Plus, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";

type UnitType = {
  id: string;
  type: string;
  count_total: number;
  available_count: number;
  available_now: boolean;
  surface_min: number | null;
  surface_max: number | null;
};

type Apartment = {
  type: string | null;
  surface_m2: number | null;
  status: string;
  available_from: string | null;
};

type AptStats = {
  count_total: number;
  available_count: number;
  available_now: number;
  surface_min: number | null;
  surface_max: number | null;
};

export default function UnitsStep({ residence, setExternalSaving }: StepProps) {
  const [units, setUnits] = useState<UnitType[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: u }, { data: a }] = await Promise.all([
      supabase.from("unit_types").select("*").eq("residence_id", residence.id).order("created_at"),
      supabase.from("apartments")
        .select("type, surface_m2, status, available_from")
        .eq("residence_id", residence.id)
        .neq("status", "unavailable"),
    ]);
    setUnits((u ?? []) as UnitType[]);
    setApartments((a ?? []) as Apartment[]);
    setDirtyIds(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, [residence.id]);

  const aptStatsByType = useMemo(() => {
    const map: Record<string, AptStats> = {};
    for (const apt of apartments) {
      if (!apt.type) continue;
      if (!map[apt.type]) {
        map[apt.type] = { count_total: 0, available_count: 0, available_now: 0, surface_min: null, surface_max: null };
      }
      const s = map[apt.type];
      s.count_total++;
      if (apt.status === "available") {
        s.available_count++;
        if (!apt.available_from) s.available_now++;
      }
      if (apt.surface_m2) {
        s.surface_min = s.surface_min === null ? apt.surface_m2 : Math.min(s.surface_min, apt.surface_m2);
        s.surface_max = s.surface_max === null ? apt.surface_m2 : Math.max(s.surface_max, apt.surface_m2);
      }
    }
    return map;
  }, [apartments]);

  // Auto-sync unit_types stats + capacity when apartments change
  useEffect(() => {
    if (loading || units.length === 0) return;
    (async () => {
      for (const u of units) {
        const stats = aptStatsByType[u.type];
        if (!stats) continue;
        await supabase.from("unit_types").update({
          count_total: stats.count_total,
          available_count: stats.available_count,
          available_now: stats.available_now > 0,
          surface_min: stats.surface_min,
          surface_max: stats.surface_max,
        }).eq("id", u.id);
      }
      const total = units.reduce((sum, u) => sum + (aptStatsByType[u.type]?.count_total ?? 0), 0);
      await supabase.from("residences").update({ capacity: total }).eq("id", residence.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptStatsByType, loading]);

  const addUnit = async () => {
    const { data, error } = await supabase.from("unit_types").insert({
      residence_id: residence.id, type: "studio", count_total: 0, available_count: 0,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setUnits((u) => [...u, data as UnitType]);
  };

  const removeUnit = async (id: string) => {
    const { error } = await supabase.from("unit_types").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setUnits((u) => u.filter((x) => x.id !== id));
    setDirtyIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
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
      const { error } = await supabase.from("unit_types").update({ type: u.type }).eq("id", u.id);
      if (error) throw error;
      setDirtyIds((prev) => { const n = new Set(prev); n.delete(u.id); return n; });
      setExternalSaving("saved");
      toast.success(`Type de logement enregistré.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setExternalSaving("error");
    } finally {
      setSavingIds((prev) => { const n = new Set(prev); n.delete(u.id); return n; });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 3 — Logements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Info className="h-4 w-4" />
            Ces données sont calculées automatiquement
          </div>
          <p className="text-sm text-muted-foreground">
            Les informations ci-dessous (nombre de logements, disponibilités, surfaces) sont synchronisées
            en temps réel depuis vos appartements enregistrés. Pour les modifier, utilisez{" "}
            <Link to={`/partenaire/residences/${residence.id}/appartements`} className="font-medium text-primary underline">
              Gérer les appartements
            </Link>.
          </p>
        </div>

        {loading ? <p className="text-muted-foreground">Chargement…</p> : (
          <>
            {units.map((u) => {
              const isDirty = dirtyIds.has(u.id);
              const isSaving = savingIds.has(u.id);
              const stats = aptStatsByType[u.type];
              return (
                <Card key={u.id} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="grid gap-3 md:grid-cols-2 flex-1">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Type de logement</Label>
                          <select
                            value={u.type}
                            onChange={(e) => update(u.id, { type: e.target.value })}
                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">-- Choisir un type --</option>
                            {UNIT_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label>Nombre total de logements</Label>
                          <div className="flex h-12 items-center rounded-md border border-input bg-muted/50 px-3 cursor-not-allowed text-sm font-medium">
                            {stats?.count_total ?? 0}
                          </div>
                          <p className="text-xs text-muted-foreground">Calculé automatiquement depuis vos appartements enregistrés</p>
                        </div>

                        <div className="space-y-1">
                          <Label>Disponibles</Label>
                          <div className="flex h-12 items-center rounded-md border border-input bg-muted/50 px-3 cursor-not-allowed text-sm font-medium">
                            {stats?.available_count ?? 0}
                          </div>
                          <p className="text-xs text-muted-foreground">Appartements avec statut « Disponible »</p>
                        </div>

                        <div className="space-y-1">
                          <Label>Disponibles immédiatement</Label>
                          <div className="flex h-12 items-center rounded-md border border-input bg-muted/50 px-3 cursor-not-allowed text-sm font-medium">
                            {stats?.available_now ?? 0}
                          </div>
                          <p className="text-xs text-muted-foreground">Disponibles maintenant sans délai</p>
                        </div>

                        <div className="space-y-1">
                          <Label>Surface min (m²)</Label>
                          <div className="flex h-12 items-center rounded-md border border-input bg-muted/50 px-3 cursor-not-allowed text-sm font-medium">
                            {stats?.surface_min ?? "—"}
                          </div>
                          <p className="text-xs text-muted-foreground">Surface du plus petit appartement de ce type</p>
                        </div>

                        <div className="space-y-1">
                          <Label>Surface max (m²)</Label>
                          <div className="flex h-12 items-center rounded-md border border-input bg-muted/50 px-3 cursor-not-allowed text-sm font-medium">
                            {stats?.surface_max ?? "—"}
                          </div>
                          <p className="text-xs text-muted-foreground">Surface du plus grand appartement de ce type</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={isDirty ? "default" : "outline"}
                          size="icon"
                          onClick={() => saveUnit(u)}
                          disabled={isSaving || !isDirty}
                          aria-label="Enregistrer le type de logement"
                          title="Enregistrer le type de logement"
                        >
                          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
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

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}>
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
