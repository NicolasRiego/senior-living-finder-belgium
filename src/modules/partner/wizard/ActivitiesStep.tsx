import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";

type Catalog = { id: string; code: string; label_fr: string; category: string | null };
type Selected = Record<string, { frequency: string; managed_by: string }>;

export default function ActivitiesStep({ residence }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase.from("activities_catalog").select("id,code,label_fr,category").order("category"),
      supabase.from("residence_activities").select("*").eq("residence_id", residence.id),
    ]);
    setCatalog((c.data ?? []) as any);
    const map: Selected = {};
    (s.data ?? []).forEach((x: any) => { map[x.activity_id] = { frequency: x.frequency ?? "", managed_by: x.managed_by ?? "" }; });
    setSelected(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, [residence.id]);

  const toggle = async (aid: string, on: boolean) => {
    if (!on) {
      await supabase.from("residence_activities").delete().eq("residence_id", residence.id).eq("activity_id", aid);
      setSelected((s) => { const c = { ...s }; delete c[aid]; return c; });
    } else {
      await supabase.from("residence_activities").insert({ residence_id: residence.id, activity_id: aid });
      setSelected((s) => ({ ...s, [aid]: { frequency: "", managed_by: "" } }));
    }
  };

  const updateMeta = async (aid: string, patch: Partial<Selected[string]>) => {
    setSelected((s) => ({ ...s, [aid]: { ...s[aid], ...patch } }));
    await supabase.from("residence_activities").update(patch as any)
      .eq("residence_id", residence.id).eq("activity_id", aid);
  };

  if (loading) return <Card><CardContent className="py-8 text-muted-foreground">Chargement…</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>Étape 6 — Activités</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {catalog.length === 0 && (
          <p className="text-muted-foreground">Aucune activité au catalogue pour l'instant.</p>
        )}
        {catalog.map((a) => {
          const sel = selected[a.id];
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border flex-wrap">
              <Checkbox checked={!!sel} onCheckedChange={(v) => toggle(a.id, !!v)} id={`act-${a.id}`} className="h-5 w-5" />
              <Label htmlFor={`act-${a.id}`} className="flex-1 text-base cursor-pointer">{a.label_fr}</Label>
              {sel && (
                <>
                  <Input placeholder="Fréquence (ex: 2x/semaine)" value={sel.frequency} onChange={(e) => updateMeta(a.id, { frequency: e.target.value })} className="w-48 h-10" />
                  <Input placeholder="Animé par" value={sel.managed_by} onChange={(e) => updateMeta(a.id, { managed_by: e.target.value })} className="w-40 h-10" />
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
