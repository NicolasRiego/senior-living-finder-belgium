import {
  Bed, Bath, Toilet, Ruler, ChefHat, CalendarDays, Building, Wrench,
  Layers, Archive, Shirt, Briefcase, Sun, Compass, Car, ArrowUpDown,
  PhoneCall, Video, Bell, KeyRound, Flame, Droplets, Wifi, Zap,
  Leaf, ShieldCheck, Sparkles,
} from "lucide-react";
import type { ApartmentDetail } from "../publicApi";
import {
  KITCHEN_LABELS, BUILDING_STATE_LABELS, FLOORING_LABELS,
  ORIENTATION_LABELS, PARKING_LABELS, HEATING_LABELS,
  HOT_WATER_LABELS, INTERNET_LABELS, energyClassClasses,
} from "./labels";

type A = ApartmentDetail["apartment"];

function Row({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display font-semibold">{title}</h2>
      <div className="rounded-xl border border-border/60 bg-card px-4 sm:px-5">
        <div className="grid sm:grid-cols-2 sm:gap-x-8">{children}</div>
      </div>
    </section>
  );
}

function YesNo(b: boolean | null | undefined) {
  if (b === null || b === undefined) return null;
  return b ? "Oui" : "Non";
}

export function OverviewBadges({ a }: { a: A }) {
  const items: { icon: React.ComponentType<{ className?: string }>; text: string }[] = [];
  if (a.bedrooms != null) items.push({ icon: Bed, text: `${a.bedrooms} chambre${a.bedrooms > 1 ? "s" : ""}` });
  if (a.bathrooms != null) items.push({ icon: Bath, text: `${a.bathrooms} sdb` });
  if (a.surface_m2) items.push({ icon: Ruler, text: `${a.surface_m2} m²` });
  if (a.floor != null) items.push({ icon: Layers, text: a.floor === 0 ? "RDC" : `Étage ${a.floor}` });
  if (a.build_year) items.push({ icon: CalendarDays, text: `Construit en ${a.build_year}` });
  if (a.energy_class) items.push({ icon: Zap, text: `Classe ${a.energy_class}` });
  if (a.building_state) items.push({ icon: Wrench, text: BUILDING_STATE_LABELS[a.building_state] ?? a.building_state });
  if (a.orientation) items.push({ icon: Compass, text: ORIENTATION_LABELS[a.orientation] ?? a.orientation });
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display font-semibold">Aperçu</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">
            <it.icon className="h-4 w-4" /> {it.text}
          </span>
        ))}
      </div>
    </section>
  );
}

export function GeneralInfo({ a }: { a: A }) {
  return (
    <Section title="Général">
      <Row icon={Bed} label="Chambres" value={a.bedrooms ?? null} />
      <Row icon={Bath} label="Salles de bain" value={a.bathrooms ?? null} />
      <Row icon={Toilet} label="WC séparés" value={a.toilets ?? null} />
      <Row icon={Ruler} label="Surface séjour" value={a.living_room_m2 ? `${a.living_room_m2} m²` : null} />
      <Row icon={ChefHat} label="Type de cuisine" value={a.kitchen_type ? KITCHEN_LABELS[a.kitchen_type] ?? a.kitchen_type : null} />
      <Row icon={CalendarDays} label="Année de construction" value={a.build_year ?? null} />
      <Row icon={Building} label="Étages bâtiment" value={a.building_floors ?? null} />
      <Row icon={Wrench} label="État" value={a.building_state ? BUILDING_STATE_LABELS[a.building_state] ?? a.building_state : null} />
    </Section>
  );
}

export function InteriorInfo({ a }: { a: A }) {
  const storage = a.has_storage ? (a.storage_m2 ? `Oui (${a.storage_m2} m²)` : "Oui") : null;
  return (
    <Section title="Intérieur">
      <Row icon={Layers} label="Revêtement" value={a.flooring ? FLOORING_LABELS[a.flooring] ?? a.flooring : null} />
      <Row icon={Archive} label="Cave / débarras" value={storage} />
      <Row icon={Sparkles} label="Buanderie" value={YesNo(a.has_laundry)} />
      <Row icon={Shirt} label="Dressing" value={YesNo(a.has_dressing)} />
      <Row icon={Briefcase} label="Bureau" value={YesNo(a.has_office)} />
    </Section>
  );
}

export function ExteriorInfo({ a }: { a: A }) {
  const t = a.terrace ? (a.terrace_m2 ? `Oui (${a.terrace_m2} m²)` : "Oui") : null;
  const b = a.has_balcony ? (a.balcony_m2 ? `Oui (${a.balcony_m2} m²)` : "Oui") : null;
  const g = a.garden ? (a.garden_m2 ? `Oui (${a.garden_m2} m²)` : "Oui") : null;
  const parking = a.parking
    ? [a.parking_type ? PARKING_LABELS[a.parking_type] ?? a.parking_type : null,
       a.parking_count ? `${a.parking_count} place${a.parking_count > 1 ? "s" : ""}` : null]
      .filter(Boolean).join(" · ") || "Oui"
    : null;
  return (
    <Section title="Extérieur">
      <Row icon={Sun} label="Terrasse" value={t} />
      <Row icon={Sun} label="Balcon" value={b} />
      <Row icon={Leaf} label="Jardin" value={g} />
      <Row icon={Compass} label="Orientation" value={a.orientation ? ORIENTATION_LABELS[a.orientation] ?? a.orientation : null} />
      <Row icon={Car} label="Parking" value={parking} />
    </Section>
  );
}

export function InstallationsInfo({ a }: { a: A }) {
  return (
    <Section title="Installations">
      <Row icon={ArrowUpDown} label="Ascenseur" value={YesNo(a.elevator || a.has_lift)} />
      <Row icon={PhoneCall} label="Interphone" value={YesNo(a.has_interphone)} />
      <Row icon={Video} label="Visiophone" value={YesNo(a.has_videophone)} />
      <Row icon={Bell} label="Alarme" value={YesNo(a.has_alarm)} />
      <Row icon={KeyRound} label="Digicode" value={YesNo(a.has_digicode)} />
      <Row icon={Flame} label="Chauffage" value={a.heating_type ? HEATING_LABELS[a.heating_type] ?? a.heating_type : null} />
      <Row icon={Droplets} label="Eau chaude" value={a.hot_water ? HOT_WATER_LABELS[a.hot_water] ?? a.hot_water : null} />
      <Row icon={Wifi} label="Internet" value={a.internet ? INTERNET_LABELS[a.internet] ?? a.internet : null} />
    </Section>
  );
}

export function EnergyInfo({ a }: { a: A }) {
  if (!a.energy_class && !a.primary_energy && !a.double_glazing && !a.co2_emission) return null;
  return (
    <section>
      <h2 className="mb-3 font-display font-semibold">Énergie</h2>
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        {a.energy_class && (
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-lg font-bold ${energyClassClasses(a.energy_class)}`}>
              {a.energy_class}
            </span>
            <span className="text-sm text-muted-foreground">Classe énergétique (PEB)</span>
          </div>
        )}
        <div className="grid sm:grid-cols-2 sm:gap-x-8">
          <Row icon={Zap} label="Énergie primaire" value={a.primary_energy ? `${a.primary_energy} kWh/m²/an` : null} />
          <Row icon={ShieldCheck} label="Double vitrage" value={YesNo(a.double_glazing)} />
          <Row icon={Leaf} label="Émission CO₂" value={a.co2_emission ?? null} />
        </div>
      </div>
    </section>
  );
}

export function FinancesInfo({ a }: { a: A }) {
  const showRent = a.transaction_type === "rent" || a.transaction_type === "both";
  const showSale = a.transaction_type === "sale" || a.transaction_type === "both";
  const fmt = (n: number) => `${n.toLocaleString("fr-BE")} €`;
  const monthlyTotal = showRent
    ? (a.rent_price ?? 0) + (a.charges_monthly ?? 0) + (a.co_ownership_fee ?? 0)
    : null;
  return (
    <section>
      <h2 className="mb-3 font-display font-semibold">Finances</h2>
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 text-sm">
        {showRent && (
          <div className="space-y-2">
            <div className="flex justify-between"><span>Loyer mensuel minimum</span><span className="font-medium">{a.rent_price ? fmt(a.rent_price) : "—"}</span></div>
            <div className="flex justify-between"><span>Charges mensuelles</span><span className="font-medium">{a.charges_monthly ? fmt(a.charges_monthly) : "—"}</span></div>
            <div className="flex justify-between"><span>Copropriété / mois</span><span className="font-medium">{a.co_ownership_fee ? fmt(a.co_ownership_fee) : "—"}</span></div>
            <div className="flex justify-between border-t border-border/60 pt-2">
              <span className="font-semibold">Total mensuel estimé</span>
              <span className="font-display font-bold text-primary">{monthlyTotal ? fmt(monthlyTotal) : "—"}</span>
            </div>
          </div>
        )}
        {showSale && (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <div className="flex justify-between"><span>Prix de vente</span><span className="font-medium">{a.sale_price ? fmt(a.sale_price) : "—"}</span></div>
            <div className="flex justify-between"><span>Précompte immobilier / an</span><span className="font-medium">{a.property_tax ? fmt(a.property_tax) : "—"}</span></div>
            <div className="flex justify-between"><span>Frais d'agence</span><span className="font-medium">{a.agency_fee ? fmt(a.agency_fee) : "—"}</span></div>
          </div>
        )}
      </div>
    </section>
  );
}
