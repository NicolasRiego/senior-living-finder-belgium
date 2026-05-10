import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { Plus, Trash2, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label])
);

type Charge = {
  id: string;
  label: string;
  description: string | null;
  amount: number;
  is_mandatory: boolean;
  sort_order: number;
};

type AptRow = {
  type: string;
  rent_price: number | null;
  charges_monthly: number | null;
  transaction_type: string;
  status: string;
};

type SummaryRow = {
  type: string;
  rentMin: number | null;
  rentMax: number | null;
  count: number;
};

export default function PricingStep({ residence, setExternalSaving }: StepProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [apartments, setApartments] = useState<AptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, a] = await Promise.all([
      supabase
        .from("residence_charges")
        .select("*")
        .eq("residence_id", residence.id)
        .order("sort_order"),
      supabase
        .from("apartments")
        .select("type, rent_price, charges_monthly, transaction_type, status")
        .eq("residence_id", residence.id)
        .neq("status", "unavailable")
        .order("type"),
    ]);
    setCharges((c.data ?? []) as Charge[]);
    setApartments((a.data ?? []) as AptRow[]);
    setDirtyIds(new Set());
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residence.id]);

  const totalMandatory = useMemo(
    () =>
      charges
        .filter(
          (c) =>
            c.is_mandatory &&
            c.amount > 0 &&
            c.label !== "Nouveau service" &&
            !dirtyIds.has(c.id),
        )
        .reduce((sum, c) => sum + (c.amount ?? 0), 0),
    [charges, dirtyIds]
  );

  const summary = useMemo<SummaryRow[]>(() => {
    const map: Record<string, SummaryRow> = {};
    for (const a of apartments) {
      if (!["rent", "both"].includes(a.transaction_type)) continue;
      if (!a.rent_price) continue;
      if (!map[a.type]) {
        map[a.type] = { type: a.type, rentMin: null, rentMax: null, count: 0 };
      }
      const s = map[a.type];
      s.count++;
      s.rentMin = s.rentMin === null ? a.rent_price : Math.min(s.rentMin, a.rent_price);
      s.rentMax = s.rentMax === null ? a.rent_price : Math.max(s.rentMax, a.rent_price);
    }
    return Object.values(map).sort((a, b) => a.type.localeCompare(b.type));
  }, [apartments]);

  const updateCharge = (id: string, patch: Partial<Charge>) => {
    setDirtyIds((prev) => new Set(prev).add(id));
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveCharge = async (c: Charge) => {
    setSavingIds((prev) => new Set(prev).add(c.id));
    setExternalSaving("saving");
    try {
      const { error } = await supabase
        .from("residence_charges")
        .update({
          label: c.label,
          description: c.description,
          amount: c.amount,
          is_mandatory: c.is_mandatory,
          sort_order: c.sort_order,
        })
        .eq("id", c.id);
      if (error) throw error;
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
      setExternalSaving("saved");
      toast.success(`"${c.label}" enregistré.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur d'enregistrement";
      toast.error(msg);
      setExternalSaving("error");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }
  };

  const addCharge = async () => {
    const { data, error } = await supabase
      .from("residence_charges")
      .insert({
        residence_id: residence.id,
        label: "Nouveau service",
        amount: 0,
        is_mandatory: true,
        sort_order: charges.length,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCharges((prev) => [...prev, data as Charge]);
    setDirtyIds((prev) => new Set(prev).add(data.id));
  };

  const deleteCharge = async (id: string) => {
    const { error } = await supabase.from("residence_charges").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCharges((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
    toast.success("Charge supprimée.");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-muted-foreground">Chargement…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1 : Charges de la résidence */}
      <Card>
        <CardHeader>
          <CardTitle>Étape 4 — Tarifs &amp; charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Banner info */}
          <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Charges &amp; services de la résidence</p>
              <p className="text-sm text-muted-foreground mt-1">
                Renseignez ici les charges et services facturés à tous les résidents
                (obligatoires) ou proposés en option. Ces montants s'ajoutent au loyer de chaque
                appartement pour calculer le coût total mensuel.
              </p>
            </div>
          </div>

          {/* Liste des charges */}
          <div className="space-y-3">
            {charges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune charge renseignée. Cliquez sur "+ Ajouter" pour commencer.
              </p>
            )}

            {charges.map((c) => {
              const isDirty = dirtyIds.has(c.id);
              const isSaving = savingIds.has(c.id);
              return (
                <div key={c.id} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                        <div className="space-y-1">
                          <Label>Intitulé du service *</Label>
                          <Input
                            value={c.label}
                            onChange={(e) => updateCharge(c.id, { label: e.target.value })}
                            placeholder="ex: Sécurité 24h/24, Nettoyage parties communes..."
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Montant (€/mois) *</Label>
                          <Input
                            type="number"
                            value={c.amount ?? 0}
                            onChange={(e) =>
                              updateCharge(c.id, { amount: Number(e.target.value) })
                            }
                            placeholder="ex: 250"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Description (optionnel)</Label>
                        <Textarea
                          value={c.description ?? ""}
                          onChange={(e) =>
                            updateCharge(c.id, { description: e.target.value || null })
                          }
                          placeholder="Précisez ce que comprend ce service..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={c.is_mandatory}
                          onCheckedChange={(v) => updateCharge(c.id, { is_mandatory: v })}
                          aria-label="Charge obligatoire"
                        />
                        <div>
                          <Label className="cursor-pointer">
                            {c.is_mandatory ? "Obligatoire" : "Optionnel"}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {c.is_mandatory
                              ? "Inclus pour tous les résidents"
                              : "Proposé en option"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant={isDirty ? "default" : "outline"}
                        size="icon"
                        onClick={() => saveCharge(c)}
                        disabled={isSaving || !isDirty}
                        aria-label={isDirty ? "Enregistrer" : "Déjà enregistré"}
                        title={isDirty ? "Enregistrer" : "Déjà enregistré"}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(c.id)}
                        aria-label="Supprimer la charge"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="lg" onClick={addCharge} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une charge / un service
          </Button>

          {(totalMandatory > 0 || dirtyIds.size > 0) && (
            <div className="rounded-xl bg-muted/50 border border-border/60 px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total charges obligatoires / mois</span>
                <span className="text-lg font-bold text-primary">
                  {totalMandatory.toLocaleString("fr-BE")} €
                </span>
              </div>
              {dirtyIds.size > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ {dirtyIds.size} modification{dirtyIds.size > 1 ? "s" : ""} non sauvegardée
                  {dirtyIds.size > 1 ? "s" : ""} — enregistrez pour mettre à jour la fiche publique.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2 : Tableau récapitulatif */}
      {summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Récapitulatif des coûts par type de logement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Calculé automatiquement depuis vos appartements + charges obligatoires. Affiché sur la
              fiche publique.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Type de logement</th>
                    <th className="px-4 py-3 text-right font-medium">Loyer</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Charges &amp; services obligatoires
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-primary">
                      Coût total min / mois
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Total max / mois
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s, i) => {
                    const rentMin = s.rentMin ?? 0;
                    const totalMin = rentMin + totalMandatory;
                    const totalMax = s.rentMax ? s.rentMax + totalMandatory : null;
                    const hasRange = totalMax && totalMax > totalMin;
                    return (
                      <tr
                        key={s.type}
                        className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                      >
                        <td className="px-4 py-3 font-medium">
                          {TYPE_LABEL[s.type] ?? s.type}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.rentMin === s.rentMax || !s.rentMax
                            ? `${s.rentMin?.toLocaleString("fr-BE")} €`
                            : `${s.rentMin?.toLocaleString("fr-BE")} – ${s.rentMax?.toLocaleString("fr-BE")} €`}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {totalMandatory > 0
                            ? `${totalMandatory.toLocaleString("fr-BE")} €`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {totalMin.toLocaleString("fr-BE")} €
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-muted-foreground">
                          {hasRange ? `${totalMax!.toLocaleString("fr-BE")} €` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Le total minimum est calculé sur la base du loyer le moins cher + charges obligatoires.
              Le total maximum correspond au loyer le plus élevé du même type + charges obligatoires.
              Estimation indicative, à confirmer avec la résidence.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => {
          if (!o) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette charge ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La charge sera supprimée de la fiche résidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => confirmDeleteId && deleteCharge(confirmDeleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
