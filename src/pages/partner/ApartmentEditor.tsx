import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const BOOL_FIELDS = [
  ["parking", "Parking"], ["cave", "Cave"],
  ["terrace", "Terrasse"], ["garden", "Jardin"],
  ["furnished", "Meublé"], ["kitchen_equipped", "Cuisine équipée"],
  ["elevator", "Ascenseur"], ["wheelchair_accessible", "Accessible PMR"],
] as const;

type BoolField = (typeof BOOL_FIELDS)[number][0];

type FormState = {
  title_fr: string;
  type: string;
  status: "available" | "reserved" | "unavailable";
  available_from: string;
  surface_m2: string;
  floor: string;
  address_complement: string;
  transaction_type: "rent" | "sale" | "both" | "";
  rent_price: string;
  charges_monthly: string;
  sale_price: string;
  description_fr: string;
} & Record<BoolField, boolean>;

const empty: FormState = {
  title_fr: "", type: "", status: "available", available_from: "",
  surface_m2: "", floor: "", address_complement: "",
  transaction_type: "", rent_price: "", charges_monthly: "", sale_price: "",
  description_fr: "",
  parking: false, cave: false, terrace: false, garden: false,
  furnished: false, kitchen_equipped: false, elevator: false, wheelchair_accessible: false,
};

export default function ApartmentEditor() {
  const { residenceId, apartmentId } = useParams<{ residenceId: string; apartmentId?: string }>();
  const navigate = useNavigate();
  const { isAdmin, orgIds } = useAuth();
  const isEdit = !!apartmentId;
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [residenceName, setResidenceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!residenceId) return;
    (async () => {
      const { data: r } = await supabase
        .from("residences")
        .select("id, nom_fr, org_id")
        .eq("id", residenceId)
        .maybeSingle();
      if (!r) {
        toast.error("Résidence introuvable");
        navigate("/partenaire");
        return;
      }
      if (!isAdmin && !orgIds.includes(r.org_id)) {
        toast.error("Accès non autorisé");
        navigate("/partenaire");
        return;
      }
      setResidenceName(r.nom_fr);

      if (isEdit && apartmentId) {
        const { data: a, error } = await supabase
          .from("apartments")
          .select("*")
          .eq("id", apartmentId)
          .maybeSingle();
        if (error || !a) {
          toast.error("Appartement introuvable");
          navigate(`/partenaire/residences/${residenceId}/appartements`);
          return;
        }
        setForm({
          title_fr: a.title_fr ?? "",
          type: (a.type as FormState["type"]) ?? "",
          status: (a.status as FormState["status"]) ?? "available",
          available_from: a.available_from ?? "",
          surface_m2: a.surface_m2?.toString() ?? "",
          floor: a.floor?.toString() ?? "",
          address_complement: (a as { address_complement?: string }).address_complement ?? "",
          transaction_type: (a.transaction_type as FormState["transaction_type"]) ?? "",
          rent_price: a.rent_price?.toString() ?? "",
          charges_monthly: (a as { charges_monthly?: number }).charges_monthly?.toString() ?? "",
          sale_price: a.sale_price?.toString() ?? "",
          description_fr: a.description_fr ?? "",
          parking: !!a.parking, cave: !!a.cave, terrace: !!a.terrace, garden: !!a.garden,
          furnished: !!a.furnished, kitchen_equipped: !!a.kitchen_equipped,
          elevator: !!a.elevator, wheelchair_accessible: !!a.wheelchair_accessible,
        });
      }
      setLoading(false);
    })();
  }, [residenceId, apartmentId, isEdit, isAdmin, orgIds, navigate]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const schema = z.object({
      title_fr: z.string().trim().min(1, "Titre requis").max(150),
      type: z.enum(["appartement", "studio", "chambre"], { errorMap: () => ({ message: "Type requis" }) }),
      status: z.enum(["available", "reserved", "unavailable"]),
      surface_m2: z.coerce.number().positive("Surface > 0"),
      floor: z.coerce.number().int().min(0, "Étage ≥ 0"),
      transaction_type: z.enum(["rent", "sale", "both"], { errorMap: () => ({ message: "Transaction requise" }) }),
      description_fr: z.string().max(1000).optional().or(z.literal("")),
    });
    const r = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!r.success) {
      for (const i of r.error.issues) errs[i.path[0] as string] = i.message;
    }
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
    if (!validate()) {
      toast.error("Corrigez les erreurs du formulaire");
      return;
    }
    setSaving(true);
    const payload = {
      residence_id: residenceId,
      title_fr: form.title_fr.trim(),
      title_nl: form.title_fr.trim(),
      type: form.type as string,
      status: form.status,
      available_from: form.available_from || null,
      surface_m2: Number(form.surface_m2),
      floor: Number(form.floor),
      address_complement: form.address_complement.trim() || null,
      transaction_type: form.transaction_type as string,
      rent_price: form.transaction_type !== "sale" && form.rent_price ? Number(form.rent_price) : null,
      charges_monthly: form.transaction_type !== "sale" && form.charges_monthly ? Number(form.charges_monthly) : null,
      sale_price: form.transaction_type !== "rent" && form.sale_price ? Number(form.sale_price) : null,
      description_fr: form.description_fr.trim() || null,
      parking: form.parking, cave: form.cave, terrace: form.terrace, garden: form.garden,
      furnished: form.furnished, kitchen_equipped: form.kitchen_equipped,
      elevator: form.elevator, wheelchair_accessible: form.wheelchair_accessible,
    };
    const { error } = isEdit && apartmentId
      ? await supabase.from("apartments").update(payload).eq("id", apartmentId)
      : await supabase.from("apartments").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isEdit ? "Appartement mis à jour" : "Appartement créé");
    navigate(`/partenaire/residences/${residenceId}/appartements`);
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  const showRent = form.transaction_type === "rent" || form.transaction_type === "both";
  const showSale = form.transaction_type === "sale" || form.transaction_type === "both";

  return (
    <div className="space-y-6 max-w-3xl">
      <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/partenaire" className="hover:text-foreground">Mon espace</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/edition`} className="hover:text-foreground">
          {residenceName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/appartements`} className="hover:text-foreground">
          Appartements
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{isEdit ? "Modifier" : "Nouveau"}</span>
      </nav>

      <h1 className="font-display text-3xl">
        {isEdit ? "Modifier l'appartement" : "Nouvel appartement"}
      </h1>

      <Card>
        <CardHeader><CardTitle>Identification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Titre (français)" required error={errors.title_fr}>
            <Input
              value={form.title_fr}
              onChange={(e) => set("title_fr", e.target.value)}
              placeholder="ex: Appartement 2 chambres vue parc"
              maxLength={150}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type de bien" required error={errors.type}>
              <Select value={form.type} onValueChange={(v) => set("type", v as FormState["type"])}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="chambre">Chambre</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Statut" required>
              <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
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
              <Input type="number" min={1} value={form.surface_m2}
                onChange={(e) => set("surface_m2", e.target.value)} />
            </Field>
            <Field label="Étage" required error={errors.floor} hint="0 pour le rez-de-chaussée">
              <Input type="number" min={0} value={form.floor}
                onChange={(e) => set("floor", e.target.value)} />
            </Field>
          </div>
          <Field label="Complément d'adresse">
            <Input
              value={form.address_complement}
              onChange={(e) => set("address_complement", e.target.value)}
              placeholder="ex: Bâtiment B, porte 12"
              maxLength={150}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transaction & prix</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Type de transaction" required error={errors.transaction_type}>
            <RadioGroup
              value={form.transaction_type}
              onValueChange={(v) => set("transaction_type", v as FormState["transaction_type"])}
              className="flex flex-col gap-2"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="rent" /> À louer uniquement
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="sale" /> À vendre uniquement
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="both" /> Les deux (location et vente)
              </label>
            </RadioGroup>
          </Field>
          {showRent && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Loyer mensuel (€)" required error={errors.rent_price}>
                <Input type="number" min={0} value={form.rent_price}
                  onChange={(e) => set("rent_price", e.target.value)} placeholder="ex: 1850" />
              </Field>
              <Field label="Charges mensuelles (€)" hint="Eau, chauffage, parties communes">
                <Input type="number" min={0} value={form.charges_monthly}
                  onChange={(e) => set("charges_monthly", e.target.value)} placeholder="ex: 250" />
              </Field>
            </div>
          )}
          {showSale && (
            <Field label="Prix de vente (€)" required error={errors.sale_price}>
              <Input type="number" min={0} value={form.sale_price}
                onChange={(e) => set("sale_price", e.target.value)} placeholder="ex: 245000" />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Équipements</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {BOOL_FIELDS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={form[k]}
                  onCheckedChange={(v) => set(k, v === true)}
                  aria-label={label}
                />
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
            <Textarea
              value={form.description_fr}
              onChange={(e) => set("description_fr", e.target.value.slice(0, 1000))}
              placeholder="Décrivez l'appartement : vue, finitions, points forts, environnement immédiat…"
              style={{ minHeight: 120 }}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {form.description_fr.length}/1000
            </p>
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

function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
