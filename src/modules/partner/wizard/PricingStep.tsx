import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Pricing = {
  id: string;
  unit_type_id: string;
  occupation_mode: string;
  rent_min: number | null;
  rent_max: number | null;
  buy_min: number | null;
  buy_max: number | null;
  fixed_charges: number | null;
  mandatory_pack: number | null;
  estimated_monthly_min: number | null;
  estimated_monthly_max: number | null;
};
type UT = { id: string; type: string };

export default function PricingStep({ residence, setExternalSaving }: StepProps) {
  const [units, setUnits] = useState<UT[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.from("unit_types").select("id,type").eq("residence_id", residence.id);
    setUnits((u ?? []) as any);
    if (u && u.length) {
      const { data: p } = await supabase.from("pricing").select("*").in("unit_type_id", u.map((x) => x.id));
      setPricing((p ?? []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [residence.id]);

  useAutosave(pricing, async (list) => {
    setExternalSaving("saving");
    for (const p of list) {
      const { error } = await supabase.from("pricing").update({
        occupation_mode: p.occupation_mode as any,
        rent_min: p.rent_min, rent_max: p.rent_max,
        buy_min: p.buy_min, buy_max: p.buy_max,
        fixed_charges: p.fixed_charges, mandatory_pack: p.mandatory_pack,
        estimated_monthly_min: p.estimated_monthly_min, estimated_monthly_max: p.estimated_monthly_max,
      }).eq("id", p.id);
      if (error) { setExternalSaving("error"); throw error; }
    }
    setExternalSaving("saved");
  }, { enabled: pricing.length > 0 });

  const addPricing = async (unitTypeId: string) => {
    const { data, error } = await supabase.from("pricing").insert({
      unit_type_id: unitTypeId, occupation_mode: "rent" as any,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setPricing((p) => [...p, data as any]);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("pricing").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setPricing((p) => p.filter((x) => x.id !== id));
  };

  const update = (id: string, patch: Partial<Pricing>) =>
    setPricing((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));

  if (loading) return <Card><CardContent className="py-8 text-muted-foreground">Chargement…</CardContent></Card>;
  if (!units.length) return (
    <Card><CardHeader><CardTitle>Étape 4 — Tarifs</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Ajoutez d'abord des logements à l'étape 3.</p></CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader><CardTitle>Étape 4 — Tarifs</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {units.map((u) => {
          const items = pricing.filter((p) => p.unit_type_id === u.id);
          return (
            <div key={u.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">{u.type}</h3>
                <Button variant="outline" onClick={() => addPricing(u.id)}>
                  <Plus className="h-4 w-4 mr-2" />Ajouter un tarif
                </Button>
              </div>
              {items.length === 0 && <p className="text-muted-foreground text-sm">Aucun tarif renseigné.</p>}
              {items.map((p) => (
                <Card key={p.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="grid gap-3 md:grid-cols-3 flex-1">
                        <div className="space-y-1">
                          <Label>Mode</Label>
                          <Select value={p.occupation_mode} onValueChange={(v) => update(p.id, { occupation_mode: v })}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rent">Location</SelectItem>
                              <SelectItem value="buy">Achat</SelectItem>
                              <SelectItem value="rent_buy">Loc. + Achat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(p.occupation_mode === "rent" || p.occupation_mode === "rent_buy") && (
                          <>
                            <div className="space-y-1">
                              <Label>Loyer min (€)</Label>
                              <Input type="number" value={p.rent_min ?? ""} onChange={(e) => update(p.id, { rent_min: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                            </div>
                            <div className="space-y-1">
                              <Label>Loyer max (€)</Label>
                              <Input type="number" value={p.rent_max ?? ""} onChange={(e) => update(p.id, { rent_max: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                            </div>
                          </>
                        )}
                        {(p.occupation_mode === "buy" || p.occupation_mode === "rent_buy") && (
                          <>
                            <div className="space-y-1">
                              <Label>Achat min (€)</Label>
                              <Input type="number" value={p.buy_min ?? ""} onChange={(e) => update(p.id, { buy_min: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                            </div>
                            <div className="space-y-1">
                              <Label>Achat max (€)</Label>
                              <Input type="number" value={p.buy_max ?? ""} onChange={(e) => update(p.id, { buy_max: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          <Label>Charges fixes (€/mois)</Label>
                          <Input type="number" value={p.fixed_charges ?? ""} onChange={(e) => update(p.id, { fixed_charges: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label>Pack obligatoire (€/mois)</Label>
                          <Input type="number" value={p.mandatory_pack ?? ""} onChange={(e) => update(p.id, { mandatory_pack: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label>Estim. total min (€)</Label>
                          <Input type="number" value={p.estimated_monthly_min ?? ""} onChange={(e) => update(p.id, { estimated_monthly_min: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label>Estim. total max (€)</Label>
                          <Input type="number" value={p.estimated_monthly_max ?? ""} onChange={(e) => update(p.id, { estimated_monthly_max: e.target.value ? Number(e.target.value) : null })} className="h-11" />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Supprimer">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
