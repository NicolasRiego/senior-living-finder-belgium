import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, Check as CheckIcon, Trash2 } from "lucide-react";
import { Field } from "./Field";
import { useAptForm } from "./ApartmentFormContext";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import { APT_BOOL_FIELDS, type ApartmentFormState } from "./types";

function useFormSetter() {
  const { form, setForm } = useAptForm();
  const set = <K extends keyof ApartmentFormState>(k: K, v: ApartmentFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  return { form, set };
}


export function IdentificationStep() {
  const { form, set } = useFormSetter();
  return (
    <Card>
      <CardHeader><CardTitle>Identification</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Titre (français)" required>
          <Input value={form.title_fr} onChange={(e) => set("title_fr", e.target.value)}
            placeholder="ex : Appartement 2 chambres vue parc" maxLength={150} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Type de bien" required>
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
  );
}

export function LocationStep() {
  const { form, set } = useFormSetter();
  return (
    <Card>
      <CardHeader><CardTitle>Superficie & localisation</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Surface (m²)" required>
            <Input type="number" min={1} value={form.surface_m2}
              onChange={(e) => set("surface_m2", e.target.value)} />
          </Field>
          <Field label="Étage" required hint="0 pour le rez-de-chaussée">
            <Input type="number" min={0} value={form.floor}
              onChange={(e) => set("floor", e.target.value)} />
          </Field>
        </div>
        <Field label="Complément d'adresse">
          <Input value={form.address_complement}
            onChange={(e) => set("address_complement", e.target.value)}
            placeholder="ex : Bâtiment B, porte 12" maxLength={150} />
        </Field>
      </CardContent>
    </Card>
  );
}

export function TransactionStep() {
  const { form, set } = useFormSetter();
  const showRent = form.transaction_type === "rent" || form.transaction_type === "both";
  const showSale = form.transaction_type === "sale" || form.transaction_type === "both";
  return (
    <Card>
      <CardHeader><CardTitle>Transaction & prix</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Type de transaction" required>
          <RadioGroup value={form.transaction_type}
            onValueChange={(v) => set("transaction_type", v as ApartmentFormState["transaction_type"])}
            className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="rent" /> À louer uniquement</label>
            <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="sale" /> À vendre uniquement</label>
            <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="both" /> Les deux (location et vente)</label>
          </RadioGroup>
        </Field>
        {showRent && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Loyer mensuel (€)" required>
                <Input type="number" min={0} value={form.rent_price}
                  onChange={(e) => set("rent_price", e.target.value)} placeholder="ex : 1850" />
              </Field>
              <Field label="Charges mensuelles (€)">
                <Input type="number" min={0} value={form.charges_monthly}
                  onChange={(e) => set("charges_monthly", e.target.value)} placeholder="ex : 250" />
              </Field>
            </div>
            <Field label="Description des charges">
              <Input
                value={form.charges_description}
                onChange={(e) => set("charges_description", e.target.value.slice(0, 200))}
                placeholder="ex: Eau, chauffage, parties communes, entretien des jardins..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {form.charges_description.length} / 200
              </p>
            </Field>
          </>
        )}
        {showSale && (
          <Field label="Prix de vente (€)" required>
            <Input type="number" min={0} value={form.sale_price}
              onChange={(e) => set("sale_price", e.target.value)} placeholder="ex : 245000" />
          </Field>
        )}
      </CardContent>
    </Card>
  );
}

export function EquipmentsStep() {
  const { form, set } = useFormSetter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const addItem = () => {
    const label = draft.trim();
    if (!label) { setAdding(false); return; }
    const newItem = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      is_checked: true,
    };
    set("custom_equipment", [...form.custom_equipment, newItem]);
    setDraft("");
    setAdding(false);
  };

  const toggleCustom = (id: string, v: boolean) => {
    set(
      "custom_equipment",
      form.custom_equipment.map((c) => (c.id === id ? { ...c, is_checked: v } : c)),
    );
  };

  const removeCustom = (id: string) => {
    set("custom_equipment", form.custom_equipment.filter((c) => c.id !== id));
    setConfirmDelete(null);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Équipements complémentaires</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {APT_BOOL_FIELDS.filter(([k]) =>
            !["parking", "terrace", "garden", "elevator"].includes(k)
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 cursor-pointer">
              <Checkbox checked={form[k]} onCheckedChange={(v) => set(k, v === true)} aria-label={label} />
              <span>{label}</span>
            </label>
          ))}
          {form.custom_equipment.map((item) => (
            <div key={item.id} className="group flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={(v) => toggleCustom(item.id, v === true)}
                  aria-label={item.label}
                />
                <span className="truncate">{item.label}</span>
              </label>
              <button
                type="button"
                onClick={() => setConfirmDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label={`Supprimer ${item.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {adding ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addItem(); }
                if (e.key === "Escape") { setDraft(""); setAdding(false); }
              }}
              placeholder="ex : Climatisation, Sauna…"
              maxLength={80}
            />
            <Button type="button" size="sm" onClick={addItem} aria-label="Confirmer">
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setDraft(""); setAdding(false); }}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            + Ajouter un équipement
          </Button>
        )}

        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet équipement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmDelete && removeCustom(confirmDelete)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export function DescriptionStep() {
  const { form, set } = useFormSetter();
  return (
    <Card>
      <CardHeader><CardTitle>Description</CardTitle></CardHeader>
      <CardContent>
        <Field label="Description (français)">
          <Textarea value={form.description_fr}
            onChange={(e) => set("description_fr", e.target.value.slice(0, 1000))}
            placeholder="Décrivez l'appartement : vue, finitions, points forts…"
            style={{ minHeight: 120 }} />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {form.description_fr.length}/1000
          </p>
        </Field>
      </CardContent>
    </Card>
  );
}

export function PhotosStep() {
  const { residenceId } = useParams<{ residenceId: string }>();
  return (
    <Card>
      <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
          <Camera className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-2">
            <p>
              Les photos sont gérées au niveau de la résidence et sont partagées
              entre tous les appartements.
            </p>
            <Button variant="outline" asChild>
              <Link to={`/partenaire/residences/${residenceId}/edition`}>
                Gérer les photos de la résidence
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
