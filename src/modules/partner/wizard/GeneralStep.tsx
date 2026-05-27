import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { cn } from "@/lib/utils";

const types = [
  { value: "residence_services", label: "Résidence-services" },
  { value: "seigneurie", label: "Seigneurie" },
  { value: "maison_repos", label: "Maison de repos" },
  { value: "maison_repos_soins", label: "Maison de repos et de soins" },
];

export default function GeneralStep({ residence, onChange, setExternalSaving, onStepChange }: StepProps) {
  const [local, setLocal] = useState({
    nom_fr: residence.nom_fr ?? "",
    nom_nl: residence.nom_nl ?? "",
    tagline_fr: residence.tagline_fr ?? "",
    tagline_nl: residence.tagline_nl ?? "",
    description_fr: residence.description_fr ?? "",
    description_nl: residence.description_nl ?? "",
    type_etablissement: residence.type_etablissement,
  });

  const { data: apartmentCount = 0 } = useQuery({
    queryKey: ["apartment-count", residence.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("apartments")
        .select("id", { count: "exact", head: true })
        .eq("residence_id", residence.id);
      return count ?? 0;
    },
    enabled: !!residence.id,
  });


  useAutosave(local, async (v) => {
    setExternalSaving("saving");
    const { error } = await supabase
      .from("residences")
      .update({
        nom_fr: v.nom_fr,
        nom_nl: v.nom_nl || null,
        tagline_fr: v.tagline_fr || null,
        tagline_nl: v.tagline_nl || null,
        description_fr: v.description_fr || null,
        description_nl: v.description_nl || null,
        type_etablissement: v.type_etablissement as any,
      })
      .eq("id", residence.id);
    if (error) { setExternalSaving("error"); throw error; }
    setExternalSaving("saved");
    onChange(v as any);
  });

  const set = <K extends keyof typeof local>(k: K, v: typeof local[K]) =>
    setLocal((s) => ({ ...s, [k]: v }));

  const taglineFrLen = local.tagline_fr.length;
  const taglineNlLen = local.tagline_nl.length;
  const descFrLen = local.description_fr.length;
  const descNlLen = local.description_nl.length;

  const descColor = (n: number) =>
    n >= 3900 ? "text-destructive" : n >= 3500 ? "text-orange-600" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 1 — Informations générales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nom (FR) *</Label>
            <Input value={local.nom_fr} onChange={(e) => set("nom_fr", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>Naam (NL)</Label>
            <Input value={local.nom_nl} onChange={(e) => set("nom_nl", e.target.value)} className="h-12" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type d'établissement *</Label>
            <Select value={local.type_etablissement} onValueChange={(v) => set("type_etablissement", v)}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Capacité (nombre total de logements)
            </Label>
            <div className="mt-1 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/50 px-4 py-3 text-muted-foreground cursor-not-allowed">
              <span className="text-xl font-semibold text-foreground">
                {apartmentCount}
              </span>
              <span className="text-sm">logements définis</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Ce nombre se met à jour automatiquement quand vous ajoutez ou modifiez des logements dans l'étape "Logements".
            </p>
            {onStepChange && (
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs text-primary"
                onClick={() => onStepChange("units")}
              >
                → Gérer les logements
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Accroche (FR) — max 160 caractères</Label>
            <Textarea
              rows={3}
              maxLength={160}
              value={local.tagline_fr}
              onChange={(e) => set("tagline_fr", e.target.value)}
              placeholder="Ex: Résidence calme et verdoyante au cœur de Bruxelles, idéale pour seniors actifs."
            />
            <p className={cn("text-xs text-right", taglineFrLen > 140 ? "text-destructive" : "text-muted-foreground")}>
              {taglineFrLen} / 160 caractères
            </p>
          </div>
          <div className="space-y-2">
            <Label>Slogan (NL) — max 160 caractères</Label>
            <Textarea
              rows={3}
              maxLength={160}
              value={local.tagline_nl}
              onChange={(e) => set("tagline_nl", e.target.value)}
              placeholder="Bv: Rustige en groene residentie in het hart van Brussel."
            />
            <p className={cn("text-xs text-right", taglineNlLen > 140 ? "text-destructive" : "text-muted-foreground")}>
              {taglineNlLen} / 160 caractères
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (FR) — max 4 000 caractères</Label>
          <Textarea
            rows={8}
            maxLength={4000}
            value={local.description_fr}
            onChange={(e) => set("description_fr", e.target.value)}
          />
          <p className={cn("text-xs text-right", descColor(descFrLen))}>
            {descFrLen.toLocaleString("fr-BE")} / 4 000 caractères
          </p>
        </div>

        <div className="space-y-2">
          <Label>Beschrijving (NL) — max 4 000 caractères</Label>
          <Textarea
            rows={8}
            maxLength={4000}
            value={local.description_nl}
            onChange={(e) => set("description_nl", e.target.value)}
          />
          <p className={cn("text-xs text-right", descColor(descNlLen))}>
            {descNlLen.toLocaleString("fr-BE")} / 4 000 caractères
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
