import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";

const regions = ["Bruxelles", "Wallonie", "Flandre"];
const provinces = [
  "Brabant wallon", "Hainaut", "Liège", "Luxembourg", "Namur",
  "Anvers", "Brabant flamand", "Flandre-Occidentale", "Flandre-Orientale", "Limbourg",
  "Bruxelles-Capitale",
];

export default function AddressStep({ residence, onChange, setExternalSaving }: StepProps) {
  const [local, setLocal] = useState({
    adresse: residence.adresse ?? "",
    code_postal: residence.code_postal ?? "",
    ville: residence.ville ?? "",
    province: residence.province ?? "",
    region: residence.region ?? "",
    latitude: residence.latitude?.toString() ?? "",
    longitude: residence.longitude?.toString() ?? "",
  });

  useAutosave(local, async (v) => {
    setExternalSaving("saving");
    const { error } = await supabase.from("residences").update({
      adresse: v.adresse || null,
      code_postal: v.code_postal || null,
      ville: v.ville || null,
      province: v.province || null,
      region: v.region || null,
      latitude: v.latitude ? Number(v.latitude) : null,
      longitude: v.longitude ? Number(v.longitude) : null,
    }).eq("id", residence.id);
    if (error) { setExternalSaving("error"); throw error; }
    setExternalSaving("saved");
    onChange(v as any);
  });

  const set = (k: keyof typeof local, v: string) => setLocal((s) => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader><CardTitle>Étape 2 — Adresse</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Adresse complète</Label>
          <Input value={local.adresse} onChange={(e) => set("adresse", e.target.value)} placeholder="Rue de la Loi 16" className="h-12" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Code postal</Label>
            <Input value={local.code_postal} onChange={(e) => set("code_postal", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={local.ville} onChange={(e) => set("ville", e.target.value)} className="h-12" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Région</Label>
            <Select value={local.region} onValueChange={(v) => set("region", v)}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Province</Label>
            <Select value={local.province} onValueChange={(v) => set("province", v)}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Latitude (optionnel)</Label>
            <Input value={local.latitude} onChange={(e) => set("latitude", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label>Longitude (optionnel)</Label>
            <Input value={local.longitude} onChange={(e) => set("longitude", e.target.value)} className="h-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
