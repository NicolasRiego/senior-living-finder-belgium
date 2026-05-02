import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { toast } from "sonner";
import { useAutosave } from "../useAutosave";

type Catalog = { id: string; code: string; label_fr: string; category: string | null };
type Selected = Record<string, { included: boolean; optional: boolean; price: number | null }>;

export default function ServicesStep({ residence, setExternalSaving }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cat, sel] = await Promise.all([
      supabase.from("services_catalog").select("id,code,label_fr,category").order("category"),
      supabase.from("residence_services").select("*").eq("residence_id", residence.id),
    ]);
    setCatalog((cat.data ?? []) as any);
    const map: Selected = {};
    (sel.data ?? []).forEach((s: any) => {
      map[s.service_id] = { included: s.included, optional: s.optional, price: s.price };
    });
    setSelected(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, [residence.id]);

  useAutosave(selected, async (sel) => {
    setExternalSaving("saving");
    // upsert each
    for (const [service_id, v] of Object.entries(sel)) {
      const { error } = await supabase.from("residence_services").upsert({
        residence_id: residence.id, service_id, included: v.included, optional: v.optional, price: v.price,
      } as any, { onConflict: "residence_id,service_id" as any });
      if (error) { setExternalSaving("error"); return; }
    }
    setExternalSaving("saved");
  }, { enabled: !loading });

  const toggle = async (sid: string, included: boolean) => {
    if (!included) {
      // remove
      await supabase.from("residence_services").delete().eq("residence_id", residence.id).eq("service_id", sid);
      setSelected((s) => { const c = { ...s }; delete c[sid]; return c; });
      return;
    }
    setSelected((s) => ({ ...s, [sid]: { included: true, optional: false, price: null } }));
  };

  if (loading) return <Card><CardContent className="py-8 text-muted-foreground">Chargement…</CardContent></Card>;

  // group
  const grouped: Record<string, Catalog[]> = {};
  catalog.forEach((c) => {
    const k = c.category ?? "Autres";
    (grouped[k] ||= []).push(c);
  });

  return (
    <Card>
      <CardHeader><CardTitle>Étape 5 — Services</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {catalog.length === 0 && (
          <p className="text-muted-foreground">
            Aucun service au catalogue pour l'instant. L'administrateur doit l'enrichir.
          </p>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h3 className="font-display text-lg">{cat}</h3>
            {items.map((s) => {
              const sel = selected[s.id];
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={!!sel?.included}
                    onCheckedChange={(v) => toggle(s.id, !!v)}
                    id={`svc-${s.id}`}
                    className="h-5 w-5"
                  />
                  <Label htmlFor={`svc-${s.id}`} className="flex-1 text-base cursor-pointer">{s.label_fr}</Label>
                  {sel && (
                    <>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={sel.optional} onCheckedChange={(v) => setSelected((m) => ({ ...m, [s.id]: { ...m[s.id], optional: !!v } }))} />
                        Optionnel
                      </label>
                      <Input type="number" placeholder="€" value={sel.price ?? ""} onChange={(e) => setSelected((m) => ({ ...m, [s.id]: { ...m[s.id], price: e.target.value ? Number(e.target.value) : null } }))} className="w-24 h-10" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
