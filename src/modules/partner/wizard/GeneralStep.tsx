import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";

const types = [
  { value: "residence_services", label: "Résidence-services" },
  { value: "seigneurie", label: "Seigneurie" },
  { value: "maison_repos", label: "Maison de repos" },
  { value: "maison_repos_soins", label: "Maison de repos et de soins" },
];

export default function GeneralStep({ residence, onChange, setExternalSaving }: StepProps) {
  const [local, setLocal] = useState({
    nom_fr: residence.nom_fr ?? "",
    nom_nl: residence.nom_nl ?? "",
    tagline_fr: residence.tagline_fr ?? "",
    tagline_nl: residence.tagline_nl ?? "",
    description_fr: residence.description_fr ?? "",
    description_nl: residence.description_nl ?? "",
    type_etablissement: residence.type_etablissement,
    capacity: residence.capacity ?? "",
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
        capacity: v.capacity ? Number(v.capacity) : null,
      })
      .eq("id", residence.id);
    if (error) { setExternalSaving("error"); throw error; }
    setExternalSaving("saved");
    onChange(v as any);
  });

  const set = <K extends keyof typeof local>(k: K, v: typeof local[K]) =>
    setLocal((s) => ({ ...s, [k]: v }));

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
            <Label>Capacité (nombre total de places)</Label>
            <Input type="number" min="0" value={local.capacity}
              onChange={(e) => set("capacity", e.target.value)} className="h-12" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Accroche (FR)</Label>
            <Input value={local.tagline_fr} onChange={(e) => set("tagline_fr", e.target.value)} placeholder="Une seconde maison au cœur de Bruxelles" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>Slogan (NL)</Label>
            <Input value={local.tagline_nl} onChange={(e) => set("tagline_nl", e.target.value)} className="h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (FR) — minimum 80 caractères pour valider la complétude</Label>
          <Textarea rows={6} value={local.description_fr} onChange={(e) => set("description_fr", e.target.value)} />
          <p className="text-sm text-muted-foreground">{local.description_fr.length} caractères</p>
        </div>

        <div className="space-y-2">
          <Label>Beschrijving (NL)</Label>
          <Textarea rows={6} value={local.description_nl} onChange={(e) => set("description_nl", e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}
