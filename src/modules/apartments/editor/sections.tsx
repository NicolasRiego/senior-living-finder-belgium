import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NumberField, SelectField } from "./Field";
import {
  ApartmentFormState, KITCHEN_OPTIONS, BUILDING_STATE_OPTIONS,
  FLOORING_OPTIONS, ORIENTATION_OPTIONS, PARKING_TYPE_OPTIONS,
  HEATING_OPTIONS, HOT_WATER_OPTIONS, INTERNET_OPTIONS, ENERGY_CLASS_OPTIONS,
} from "./types";

type Setter = <K extends keyof ApartmentFormState>(k: K, v: ApartmentFormState[K]) => void;

type Props = { form: ApartmentFormState; set: Setter };

function Box({ k, label, form, set }: { k: keyof ApartmentFormState; label: string } & Props) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <Checkbox
        checked={form[k] as boolean}
        onCheckedChange={(v) => set(k, (v === true) as never)}
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  );
}

export function GeneralSection({ form, set }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Général</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Chambres" value={form.bedrooms} onChange={(v) => set("bedrooms", v)} min={0} max={10} />
          <NumberField label="Salles de bain" value={form.bathrooms} onChange={(v) => set("bathrooms", v)} min={0} max={10} />
          <NumberField label="WC séparés" value={form.toilets} onChange={(v) => set("toilets", v)} min={0} max={10} />
          <NumberField label="Surface séjour (m²)" value={form.living_room_m2} onChange={(v) => set("living_room_m2", v)} min={0} />
          <SelectField label="Type de cuisine" value={form.kitchen_type} onChange={(v) => set("kitchen_type", v)} options={KITCHEN_OPTIONS} />
          <NumberField label="Année de construction" value={form.build_year} onChange={(v) => set("build_year", v)} min={1700} max={2100} />
          <NumberField label="Étages dans le bâtiment" value={form.building_floors} onChange={(v) => set("building_floors", v)} min={1} max={100} />
          <SelectField label="État général" value={form.building_state} onChange={(v) => set("building_state", v)} options={BUILDING_STATE_OPTIONS} />
        </div>
      </CardContent>
    </Card>
  );
}

export function InteriorSection({ form, set }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Intérieur</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <SelectField label="Revêtement de sol" value={form.flooring} onChange={(v) => set("flooring", v)} options={FLOORING_OPTIONS} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Box k="has_storage" label="Cave / débarras" form={form} set={set} />
          <Box k="has_laundry" label="Local buanderie" form={form} set={set} />
          <Box k="has_dressing" label="Dressing" form={form} set={set} />
          <Box k="has_office" label="Bureau / pièce de travail" form={form} set={set} />
        </div>
        {form.has_storage && (
          <NumberField
            label="Surface cave/débarras (m²)"
            value={form.storage_m2}
            onChange={(v) => set("storage_m2", v)}
            min={0}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ExteriorSection({ form, set }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Extérieur</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Box k="terrace" label="Terrasse" form={form} set={set} />
          <Box k="has_balcony" label="Balcon" form={form} set={set} />
          <Box k="garden" label="Jardin" form={form} set={set} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {form.terrace && (
            <NumberField label="Surface terrasse (m²)" value={form.terrace_m2} onChange={(v) => set("terrace_m2", v)} min={0} />
          )}
          {form.has_balcony && (
            <NumberField label="Surface balcon (m²)" value={form.balcony_m2} onChange={(v) => set("balcony_m2", v)} min={0} />
          )}
          {form.garden && (
            <NumberField label="Surface jardin (m²)" value={form.garden_m2} onChange={(v) => set("garden_m2", v)} min={0} />
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Orientation" value={form.orientation} onChange={(v) => set("orientation", v)} options={ORIENTATION_OPTIONS} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <Field label="Parking">
            <Box k="parking" label="Parking disponible" form={form} set={set} />
          </Field>
          {form.parking && (
            <>
              <SelectField label="Type de parking" value={form.parking_type} onChange={(v) => set("parking_type", v)} options={PARKING_TYPE_OPTIONS} />
              <NumberField label="Nombre de places" value={form.parking_count} onChange={(v) => set("parking_count", v)} min={0} max={20} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function InstallationsSection({ form, set }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Installations</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Box k="elevator" label="Ascenseur" form={form} set={set} />
          <Box k="has_interphone" label="Interphone" form={form} set={set} />
          <Box k="has_videophone" label="Visiophone" form={form} set={set} />
          <Box k="has_alarm" label="Alarme" form={form} set={set} />
          <Box k="has_digicode" label="Digicode" form={form} set={set} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <SelectField label="Chauffage" value={form.heating_type} onChange={(v) => set("heating_type", v)} options={HEATING_OPTIONS} />
          <SelectField label="Eau chaude" value={form.hot_water} onChange={(v) => set("hot_water", v)} options={HOT_WATER_OPTIONS} />
          <SelectField label="Internet" value={form.internet} onChange={(v) => set("internet", v)} options={INTERNET_OPTIONS} />
        </div>
      </CardContent>
    </Card>
  );
}

export function EnergySection({ form, set }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Énergie</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Classe énergétique (PEB)"
            value={form.energy_class}
            onChange={(v) => set("energy_class", v)}
            options={ENERGY_CLASS_OPTIONS}
          />
          <NumberField
            label="Énergie primaire (kWh/m²/an)"
            value={form.primary_energy}
            onChange={(v) => set("primary_energy", v)}
            min={0}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <Box k="double_glazing" label="Double vitrage" form={form} set={set} />
          <Field label="Émission CO₂" hint="ex : 12 kg CO₂/m²/an">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.co2_emission}
              onChange={(e) => set("co2_emission", e.target.value)}
              placeholder="ex : 12 kg CO₂/m²/an"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancesExtraSection({ form, set }: Props) {
  const showSale = form.transaction_type === "sale" || form.transaction_type === "both";
  return (
    <Card>
      <CardHeader><CardTitle>Finances complémentaires</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {showSale && (
            <NumberField label="Frais d'agence (€)" value={form.agency_fee} onChange={(v) => set("agency_fee", v)} min={0} />
          )}
          {showSale && (
            <NumberField label="Précompte immobilier estimé / an (€)" value={form.property_tax} onChange={(v) => set("property_tax", v)} min={0} />
          )}
          <NumberField
            label="Charges de copropriété / mois (€)"
            value={form.co_ownership_fee}
            onChange={(v) => set("co_ownership_fee", v)}
            min={0}
            hint="Inclus ou en plus des charges mensuelles ?"
          />
        </div>
      </CardContent>
    </Card>
  );
}
