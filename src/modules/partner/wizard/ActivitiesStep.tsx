import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";

type Catalog = {
  id: string;
  code: string;
  label_fr: string;
  category: string | null;
  is_custom?: boolean;
  created_by_residence?: string | null;
};
type Selected = Record<string, { frequency: string; managed_by: string }>;

export default function ActivitiesStep({ residence }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [loading, setLoading] = useState(true);
  const [newActivityLabel, setNewActivityLabel] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("Autres");
  const [creatingActivity, setCreatingActivity] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase
        .from("activities_catalog")
        .select("id,code,label_fr,category,is_custom,created_by_residence")
        .or(`is_custom.eq.false,created_by_residence.eq.${residence.id}`)
        .order("category"),
      supabase.from("residence_activities").select("*").eq("residence_id", residence.id),
    ]);
    setCatalog((c.data ?? []) as any);
    const map: Selected = {};
    (s.data ?? []).forEach((x: any) => {
      map[x.activity_id] = { frequency: x.frequency ?? "", managed_by: x.managed_by ?? "" };
    });
    setSelected(map);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [residence.id]);

  const toggle = async (aid: string, on: boolean) => {
    if (!on) {
      await supabase.from("residence_activities").delete().eq("residence_id", residence.id).eq("activity_id", aid);
      setSelected((s) => {
        const c = { ...s };
        delete c[aid];
        return c;
      });
    } else {
      await supabase.from("residence_activities").insert({ residence_id: residence.id, activity_id: aid });
      setSelected((s) => ({ ...s, [aid]: { frequency: "", managed_by: "" } }));
    }
  };

  const updateMeta = async (aid: string, patch: Partial<Selected[string]>) => {
    setSelected((s) => ({ ...s, [aid]: { ...s[aid], ...patch } }));
    await supabase
      .from("residence_activities")
      .update(patch as any)
      .eq("residence_id", residence.id)
      .eq("activity_id", aid);
  };

  const createCustomActivity = async () => {
    if (!newActivityLabel.trim()) return;
    setCreatingActivity(true);
    const code = `custom_act_${residence.id.slice(0, 8)}_${Date.now()}`;
    const { data, error } = await supabase
      .from("activities_catalog")
      .insert({
        code,
        label_fr: newActivityLabel.trim(),
        category: newActivityCategory,
        is_custom: true,
        created_by_residence: residence.id,
      } as any)
      .select()
      .single();
    if (error || !data) {
      console.error("Erreur création activité:", error);
      toast.error(error?.message ? `Erreur: ${error.message}` : "Erreur inconnue lors de la création");
      setCreatingActivity(false);
      return;
    }
    setCatalog((prev) => [...prev, data as any]);
    await supabase.from("residence_activities").insert({
      residence_id: residence.id,
      activity_id: (data as any).id,
    });
    setSelected((prev) => ({ ...prev, [(data as any).id]: { frequency: "", managed_by: "" } }));
    setNewActivityLabel("");
    setCreatingActivity(false);
    toast.success(`Activité "${(data as any).label_fr}" créée.`);
  };

  const deleteCustomActivity = async (activityId: string, label: string) => {
    await supabase
      .from("residence_activities")
      .delete()
      .eq("residence_id", residence.id)
      .eq("activity_id", activityId);
    await supabase.from("activities_catalog").delete().eq("id", activityId);
    setCatalog((prev) => prev.filter((c) => c.id !== activityId));
    setSelected((prev) => {
      const next = { ...prev };
      delete next[activityId];
      return next;
    });
    toast.success(`Activité "${label}" supprimée.`);
  };

  if (loading)
    return (
      <Card>
        <CardContent className="py-8 text-muted-foreground">Chargement…</CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 6 — Activités</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {catalog.length === 0 && (
          <p className="text-muted-foreground">Aucune activité au catalogue pour l'instant.</p>
        )}
        {catalog.map((a) => {
          const sel = selected[a.id];
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border flex-wrap">
              <Checkbox
                checked={!!sel}
                onCheckedChange={(v) => toggle(a.id, !!v)}
                id={`act-${a.id}`}
                className="h-5 w-5"
              />
              <Label htmlFor={`act-${a.id}`} className="flex-1 text-base cursor-pointer">
                {a.label_fr}
                {a.is_custom && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    Personnalisé
                  </span>
                )}
              </Label>
              {sel && (
                <>
                  <Input
                    placeholder="Fréquence (ex: 2x/semaine)"
                    value={sel.frequency}
                    onChange={(e) => updateMeta(a.id, { frequency: e.target.value })}
                    className="w-48 h-10"
                  />
                  <Input
                    placeholder="Animé par"
                    value={sel.managed_by}
                    onChange={(e) => updateMeta(a.id, { managed_by: e.target.value })}
                    className="w-40 h-10"
                  />
                </>
              )}
              {a.is_custom && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Supprimer l'activité "${a.label_fr}" ?`)) {
                      deleteCustomActivity(a.id, a.label_fr);
                    }
                  }}
                  title="Supprimer cette activité personnalisée"
                  aria-label="Supprimer cette activité personnalisée"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}

        <div className="mt-6 rounded-xl border-2 border-dashed border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">+ Créer une activité personnalisée</h3>
          <p className="text-xs text-muted-foreground">
            Ajoutez une activité propre à votre résidence qui n'est pas dans le catalogue standard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="new-act-label">Nom de l'activité *</Label>
              <Input
                id="new-act-label"
                value={newActivityLabel}
                onChange={(e) => setNewActivityLabel(e.target.value)}
                placeholder="ex: Club de lecture, Yoga doux..."
                className="h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCustomActivity();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-act-cat">Catégorie</Label>
              <select
                id="new-act-cat"
                value={newActivityCategory}
                onChange={(e) => setNewActivityCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="sport">Sport & bien-être</option>
                <option value="culture">Culture & loisirs</option>
                <option value="social">Vie sociale</option>
                <option value="creatif">Créatif & manuel</option>
                <option value="nature">Nature & jardin</option>
                <option value="numerique">Numérique</option>
                <option value="Autres">Autres</option>
              </select>
            </div>
          </div>
          <Button
            onClick={createCustomActivity}
            disabled={!newActivityLabel.trim() || creatingActivity}
            variant="outline"
            className="w-full"
          >
            {creatingActivity ? "Création…" : "+ Ajouter cette activité"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
