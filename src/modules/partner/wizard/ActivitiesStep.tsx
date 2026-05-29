import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator,
} from "@/components/ui/select";

type Catalog = {
  id: string;
  code: string;
  label_fr: string;
  category: string | null;
  is_custom?: boolean;
  created_by_residence?: string | null;
};
type SelRow = {
  frequency_period: string;
  frequency_count: number | null;
  responsable: string;
};
type Selected = Record<string, SelRow>;

const PERIODS = [
  { value: "day", label: "Par jour", unit: "jour", max: 1 },
  { value: "week", label: "Par semaine", unit: "semaine", max: 7 },
  { value: "month", label: "Par mois", unit: "mois", max: 31 },
  { value: "year", label: "Par an", unit: "an", max: 365 },
] as const;

const DEFAULT_RESPONSABLES = [
  "Résidents",
  "Gestionnaire de résidence",
  "Service externe",
  "Volontaires",
];

const ADD_CUSTOM_VALUE = "__add_custom__";

function periodMax(period: string) {
  return PERIODS.find((p) => p.value === period)?.max ?? 365;
}
function periodUnit(period: string) {
  return PERIODS.find((p) => p.value === period)?.unit;
}
export function frequencyText(period: string | null | undefined, count: number | null | undefined) {
  if (!period || !count) return "";
  const unit = periodUnit(period);
  if (!unit) return "";
  return `${count} fois par ${unit}`;
}

export default function ActivitiesStep({ residence }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [customResponsables, setCustomResponsables] = useState<string[]>([]);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [newActivityLabel, setNewActivityLabel] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("Autres");
  const [creatingActivity, setCreatingActivity] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, s, r] = await Promise.all([
      supabase
        .from("activities_catalog")
        .select("id,code,label_fr,category,is_custom,created_by_residence")
        .or(`is_custom.eq.false,created_by_residence.eq.${residence.id}`)
        .order("category"),
      supabase.from("residence_activities").select("*").eq("residence_id", residence.id),
      supabase
        .from("residence_responsables_custom" as any)
        .select("label")
        .eq("residence_id", residence.id)
        .order("created_at"),
    ]);
    setCatalog((c.data ?? []) as any);
    const map: Selected = {};
    (s.data ?? []).forEach((x: any) => {
      map[x.activity_id] = {
        frequency_period: x.frequency_period ?? "",
        frequency_count: x.frequency_count ?? null,
        responsable: x.responsable ?? "",
      };
    });
    setSelected(map);
    setCustomResponsables(((r.data ?? []) as any[]).map((x) => x.label));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [residence.id]);

  const allResponsables = useMemo(
    () => [...DEFAULT_RESPONSABLES, ...customResponsables],
    [customResponsables],
  );

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
      setSelected((s) => ({
        ...s,
        [aid]: { frequency_period: "", frequency_count: null, responsable: "" },
      }));
    }
  };

  const updateMeta = async (aid: string, patch: Partial<SelRow>) => {
    setSelected((s) => ({ ...s, [aid]: { ...s[aid], ...patch } }));
    const { error } = await supabase
      .from("residence_activities")
      .update(patch as any)
      .eq("residence_id", residence.id)
      .eq("activity_id", aid);
    if (error) toast.error("Erreur de sauvegarde");
  };

  const onPeriodChange = (aid: string, period: string) => {
    const current = selected[aid]?.frequency_count ?? null;
    const max = periodMax(period);
    const clamped = current && current > max ? max : current;
    updateMeta(aid, { frequency_period: period, frequency_count: clamped });
  };

  const onCountChange = (aid: string, raw: string) => {
    const period = selected[aid]?.frequency_period || "week";
    const max = periodMax(period);
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      updateMeta(aid, { frequency_count: null });
      return;
    }
    let n = parseInt(digits, 10);
    if (n < 1) n = 1;
    if (n > max) n = max;
    updateMeta(aid, { frequency_count: n });
  };

  const onResponsableChange = (aid: string, value: string) => {
    if (value === ADD_CUSTOM_VALUE) {
      setAddingFor(aid);
      setCustomDraft("");
      return;
    }
    updateMeta(aid, { responsable: value });
  };

  const confirmCustomResponsable = async (aid: string) => {
    const label = customDraft.trim();
    if (!label) {
      setAddingFor(null);
      return;
    }
    if (!allResponsables.includes(label)) {
      const { error } = await supabase
        .from("residence_responsables_custom" as any)
        .insert({ residence_id: residence.id, label });
      if (error && !String(error.message).includes("duplicate")) {
        toast.error("Erreur lors de l'ajout");
        return;
      }
      setCustomResponsables((prev) => (prev.includes(label) ? prev : [...prev, label]));
    }
    await updateMeta(aid, { responsable: label });
    setAddingFor(null);
    setCustomDraft("");
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
      toast.error(error?.message ? `Erreur: ${error.message}` : "Erreur inconnue lors de la création");
      setCreatingActivity(false);
      return;
    }
    setCatalog((prev) => [...prev, data as any]);
    await supabase.from("residence_activities").insert({
      residence_id: residence.id,
      activity_id: (data as any).id,
    });
    setSelected((prev) => ({
      ...prev,
      [(data as any).id]: { frequency_period: "", frequency_count: null, responsable: "" },
    }));
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

        {/* Column headers */}
        {catalog.length > 0 && (
          <div className="hidden md:grid grid-cols-[1.6fr_1.4fr_1.4fr_auto] gap-3 px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Activité</div>
            <div>Fréquence</div>
            <div>Responsable</div>
            <div className="w-8" aria-hidden />
          </div>
        )}

        {catalog.map((a) => {
          const sel = selected[a.id];
          const period = sel?.frequency_period || "";
          const count = sel?.frequency_count ?? "";
          const max = period ? periodMax(period) : undefined;
          const responsable = sel?.responsable || "";
          const isCustomResp = responsable && !DEFAULT_RESPONSABLES.includes(responsable) && !customResponsables.includes(responsable);
          const selectValue =
            responsable && (DEFAULT_RESPONSABLES.includes(responsable) || customResponsables.includes(responsable))
              ? responsable
              : undefined;

          return (
            <div
              key={a.id}
              className="grid grid-cols-1 md:grid-cols-[1.6fr_1.4fr_1.4fr_auto] items-start md:items-center gap-3 p-3 rounded-lg border"
            >
              {/* Activité */}
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox
                  checked={!!sel}
                  onCheckedChange={(v) => toggle(a.id, !!v)}
                  id={`act-${a.id}`}
                  className="h-5 w-5 shrink-0"
                />
                <Label htmlFor={`act-${a.id}`} className="flex-1 text-base cursor-pointer">
                  {a.label_fr}
                  {a.is_custom && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      Personnalisé
                    </span>
                  )}
                </Label>
              </div>

              {/* Fréquence */}
              {sel ? (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Select
                      value={period || undefined}
                      onValueChange={(v) => onPeriodChange(a.id, v)}
                    >
                      <SelectTrigger className="h-10 flex-1 min-w-0">
                        <SelectValue placeholder="Période" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Nombre"
                      value={count}
                      onChange={(e) => onCountChange(a.id, e.target.value)}
                      disabled={!period}
                      className="h-10 w-24"
                      aria-label="Nombre de fois"
                    />
                  </div>
                  {period && count && (
                    <p className="text-xs text-muted-foreground">
                      {frequencyText(period, Number(count))}
                      {max ? <span className="opacity-60"> · max {max}</span> : null}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">Cochez pour activer</div>
              )}

              {/* Responsable */}
              {sel ? (
                addingFor === a.id ? (
                  <div className="flex gap-1">
                    <Input
                      autoFocus
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      placeholder="Nom du responsable"
                      className="h-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          confirmCustomResponsable(a.id);
                        } else if (e.key === "Escape") {
                          setAddingFor(null);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="default"
                      className="h-10 w-10 shrink-0"
                      onClick={() => confirmCustomResponsable(a.id)}
                      aria-label="Confirmer"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setAddingFor(null)}
                      aria-label="Annuler"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={selectValue}
                    onValueChange={(v) => onResponsableChange(a.id, v)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={isCustomResp ? responsable : "Choisir…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_RESPONSABLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                      {customResponsables.length > 0 && <SelectSeparator />}
                      {customResponsables.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={ADD_CUSTOM_VALUE} className="text-primary font-medium">
                        + Ajouter un responsable personnalisé
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )
              ) : (
                <div />
              )}

              {/* Delete custom activity */}
              <div className="flex justify-end">
                {a.is_custom ? (
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
                ) : (
                  <div className="w-8" aria-hidden />
                )}
              </div>
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
