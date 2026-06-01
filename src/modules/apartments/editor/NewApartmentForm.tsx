import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Save, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import { Field } from "./Field";
import {
  ApartmentFormState, APT_BOOL_FIELDS, formToPayload,
} from "./types";
import {
  GeneralSection, InteriorSection, ExteriorSection,
  InstallationsSection, EnergySection, FinancesExtraSection,
} from "./sections";

type Props = {
  residenceId: string;
  residenceName: string;
  form: ApartmentFormState;
  setForm: React.Dispatch<React.SetStateAction<ApartmentFormState>>;
};

export default function NewApartmentForm({ residenceId, residenceName, form, setForm }: Props) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ApartmentFormState>(k: K, v: ApartmentFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const schema = z.object({
      title_fr: z.string().trim().min(1, "Titre requis").max(150),
      type: z.enum(UNIT_TYPES.map((t) => t.value) as [string, ...string[]], { errorMap: () => ({ message: "Type requis" }) }),
      status: z.enum(["available", "reserved", "unavailable"]),
      surface_m2: z.coerce.number().positive("Surface > 0"),
      floor: z.coerce.number().int().min(0, "Étage ≥ 0"),
      transaction_type: z.enum(["rent", "sale", "both"], { errorMap: () => ({ message: "Transaction requise" }) }),
      description_fr: z.string().max(1000).optional().or(z.literal("")),
    });
    const r = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) errs[i.path[0] as string] = i.message;
    if (form.transaction_type === "rent" || form.transaction_type === "both") {
      const v = Number(form.rent_price);
      if (!v || v <= 0) errs.rent_price = "Loyer > 0 requis";
    }
    if (form.transaction_type === "sale" || form.transaction_type === "both") {
      const v = Number(form.sale_price);
      if (!v || v <= 0) errs.sale_price = "Prix de vente > 0 requis";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSave = async () => {
    if (!validate()) { toast.error("Corrigez les erreurs du formulaire"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("apartments")
      .insert(formToPayload(form, residenceId));
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Appartement créé");
    navigate(`/partenaire/residences/${residenceId}/appartements`);
  };

  const showRent = form.transaction_type === "rent" || form.transaction_type === "both";
  const showSale = form.transaction_type === "sale" || form.transaction_type === "both";

  return (
    <div className="space-y-6 max-w-3xl">
      <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/partenaire" className="hover:text-foreground">Mon espace</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/edition`} className="hover:text-foreground">{residenceName}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/appartements`} className="hover:text-foreground">Appartements</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Nouveau</span>
      </nav>

      <h1 className="font-display text-3xl">Nouvel appartement</h1>

      <Card>
        <CardHeader><CardTitle>Identification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titre (français)" required error={errors.title_fr}>
            <Input value={form.title_fr} onChange={(e) => set("title_fr", e.target.value)}
              placeholder="ex : Appartement 2 chambres vue parc" maxLength={150} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type de bien" required error={errors.type}>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Statut" required>
              <Select value={form.status} onValueChange={(v) => set("status", v as ApartmentFormState["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="reserved">Réservé</SelectItem>
                  <SelectItem value="unavailable">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Disponible à partir du">
            <Input type="date" value={form.available_from} onChange={(e) => set("available_from", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Superficie & localisation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Surface (m²)" required error={errors.surface_m2}>
              <Input type="number" min={1} value={form.surface_m2} onChange={(e) => set("surface_m2", e.target.value)} />
            </Field>
            <Field label="Étage" required error={errors.floor} hint="0 pour le rez-de-chaussée">
              <Input type="number" min={0} value={form.floor} onChange={(e) => set("floor", e.target.value)} />
            </Field>
          </div>
          <Field label="Complément d'adresse">
            <Input value={form.address_complement} onChange={(e) => set("address_complement", e.target.value)}
              placeholder="ex : Bâtiment B, porte 12" maxLength={150} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transaction & prix</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Type de transaction" required error={errors.transaction_type}>
            <RadioGroup value={form.transaction_type}
              onValueChange={(v) => set("transaction_type", v as ApartmentFormState["transaction_type"])}
              className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="rent" /> À louer uniquement</label>
              <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="sale" /> À vendre uniquement</label>
              <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="both" /> Les deux (location et vente)</label>
            </RadioGroup>
          </Field>
          {showRent && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Loyer mensuel (€)" required error={errors.rent_price}>
                <Input type="number" min={0} value={form.rent_price} onChange={(e) => set("rent_price", e.target.value)} placeholder="ex : 1850" />
              </Field>
              <Field label="Charges mensuelles (€)" hint="Eau, chauffage, parties communes">
                <Input type="number" min={0} value={form.charges_monthly} onChange={(e) => set("charges_monthly", e.target.value)} placeholder="ex : 250" />
              </Field>
            </div>
          )}
          {showSale && (
            <Field label="Prix de vente (€)" required error={errors.sale_price}>
              <Input type="number" min={0} value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} placeholder="ex : 245000" />
            </Field>
          )}
        </CardContent>
      </Card>

      <GeneralSection form={form} set={set} />
      <InteriorSection form={form} set={set} />
      <ExteriorSection form={form} set={set} />
      <InstallationsSection form={form} set={set} />
      <EnergySection form={form} set={set} />
      <FinancesExtraSection form={form} set={set} />

      <Card>
        <CardHeader><CardTitle>Équipements complémentaires</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {APT_BOOL_FIELDS.filter(([k]) => !["parking", "terrace", "garden", "elevator"].includes(k)).map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={form[k]} onCheckedChange={(v) => set(k, v === true)} aria-label={label} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent>
          <Field label="Description (français)">
            <Textarea value={form.description_fr}
              onChange={(e) => set("description_fr", e.target.value.slice(0, 1000))}
              placeholder="Décrivez l'appartement : vue, finitions, points forts, environnement immédiat…"
              style={{ minHeight: 120 }} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.description_fr.length}/1000</p>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background py-3 border-t">
        <Button variant="outline" asChild>
          <Link to={`/partenaire/residences/${residenceId}/appartements`}>
            <X className="h-4 w-4 mr-2" /> Annuler
          </Link>
        </Button>
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
