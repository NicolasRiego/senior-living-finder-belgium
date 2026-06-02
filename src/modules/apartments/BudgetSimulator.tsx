import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Save, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import type { SavedApartment } from "./savedApartments";
import { SIMULATOR_MAX } from "./simulatorLogements";
import {
  notifySimulationsChanged,
  upsertSimulation,
  type BudgetSimulationRow,
  type SelectedServicesPayload,
} from "./budgetSimulations";

const LAST_SELECTED_KEY = "budget-simulator:last-selected";

type PriceUnit =
  | "par séance" | "par repas" | "par mois" | "par semaine"
  | "par jour" | "par an" | "forfait";

type ServiceRow = {
  id: string;
  service_id: string;
  price: number | null;
  price_unit: PriceUnit | null;
  lunch_price: number | null;
  dinner_price: number | null;
  included: boolean;
  optional: boolean;
  is_free: boolean;
  from_charges: boolean;
  charges_label: string | null;
  service: { code: string; label_fr: string; category: string | null } | null;
};

type ChargeRow = { id: string; label: string; amount: number };

function isRestaurant(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes("restaurant") || l.includes("repas") || l.includes("restauration");
}

const WEEKS_PER_MONTH = 4.33;

// Convert price + unit + user freq to monthly cost
function monthlyFromUnit(price: number, unit: PriceUnit | null, freq: number, freqKind: "week" | "month"): number {
  if (!unit) return 0;
  switch (unit) {
    case "par mois":
    case "forfait":
      return price;
    case "par an":
      return price / 12;
    case "par séance":
    case "par repas":
    case "par jour":
      // freq is per week or per month
      return freqKind === "week" ? price * freq * WEEKS_PER_MONTH : price * freq;
    case "par semaine":
      return price * WEEKS_PER_MONTH;
  }
}

function needsFrequency(unit: PriceUnit | null): boolean {
  return unit === "par séance" || unit === "par repas" || unit === "par jour";
}

function isFixedMonthly(unit: PriceUnit | null): boolean {
  return unit === "par mois" || unit === "par an" || unit === "forfait" || unit === "par semaine";
}

type SelectedState = Record<string, {
  enabled: boolean;
  freq?: number;        // weekly frequency for normal services
  freqKind?: "week" | "month";
  lunchPerWeek?: number;
  dinnerPerWeek?: number;
}>;

export function BudgetSimulator({
  apartments,
  initialId,
  editing,
  onSaved,
  onRemove,
}: {
  apartments: SavedApartment[];
  initialId?: string | null;
  editing?: BudgetSimulationRow | null;
  onSaved?: () => void;
  onRemove?: (apartmentId: string) => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(
    editing?.apartment_id ?? initialId ?? apartments[0]?.id ?? null,
  );
  useEffect(() => {
    if (editing) setSelectedId(editing.apartment_id);
  }, [editing]);
  useEffect(() => {
    if (!selectedId && apartments[0]) setSelectedId(apartments[0].id);
  }, [apartments, selectedId]);


  const apt = useMemo(
    () => apartments.find((a) => a.id === selectedId) ?? null,
    [apartments, selectedId],
  );

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [loadingSvc, setLoadingSvc] = useState(false);
  const [selected, setSelected] = useState<SelectedState>({});

  const [aptExtras, setAptExtras] = useState<{
    charges_monthly: number;
    co_ownership_fee: number;
    co_ownership_included: boolean;
    co_ownership_description: string | null;
    additional: { id: string; label: string; amount: number; description: string | null; is_included: boolean }[];
  }>({
    charges_monthly: 0,
    co_ownership_fee: 0,
    co_ownership_included: false,
    co_ownership_description: null,
    additional: [],
  });

  useEffect(() => {
    if (!apt) { setServices([]); setCharges([]); setAptExtras({ charges_monthly: 0, co_ownership_fee: 0, co_ownership_included: false, co_ownership_description: null, additional: [] }); return; }
    setLoadingSvc(true);
    (async () => {
      const [svcData, chargesData, aptRow, additional] = await Promise.all([
        supabase
          .from("residence_services")
          .select("id, service_id, price, price_unit, lunch_price, dinner_price, included, optional, is_free, from_charges, charges_label, service:services_catalog(code,label_fr,category)")
          .eq("residence_id", apt.residence_id)
          .eq("included", true)
          .eq("is_available", true)
          .is("deleted_at", null),
        supabase
          .from("residence_charges")
          .select("id, label, amount")
          .eq("residence_id", apt.residence_id)
          .eq("is_mandatory", true)
          .gt("amount", 0)
          .neq("label", "Nouveau service"),
        supabase
          .from("apartments")
          .select("charges_monthly, co_ownership_fee, co_ownership_included, co_ownership_description")
          .eq("id", apt.id)
          .maybeSingle(),
        supabase
          .from("apartment_additional_charges")
          .select("id, label, amount, description, is_included, sort_order")
          .eq("apartment_id", apt.id)
          .order("sort_order"),
      ]);
      const rows = (svcData.data ?? []) as unknown as ServiceRow[];
      setServices(rows);
      setCharges((chargesData.data ?? []) as ChargeRow[]);
      const aptr = (aptRow.data ?? {}) as {
        charges_monthly?: number | null;
        co_ownership_fee?: number | null;
        co_ownership_included?: boolean | null;
        co_ownership_description?: string | null;
      };
      setAptExtras({
        charges_monthly: aptr.charges_monthly ?? 0,
        co_ownership_fee: aptr.co_ownership_fee ?? 0,
        co_ownership_included: !!aptr.co_ownership_included,
        co_ownership_description: aptr.co_ownership_description ?? null,
        additional: (additional.data ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          amount: c.amount,
          description: c.description,
          is_included: c.is_included,
        })),
      });

      // Pre-select "Inclus" services (non-removable)
      const initial: SelectedState = {};
      for (const r of rows) {
        if (r.is_free || r.from_charges) {
          initial[r.service_id] = { enabled: true };
        }
      }
      // Restore from an edited simulation if the apartment matches
      if (editing && editing.apartment_id === apt.id) {
        for (const [svcId, state] of Object.entries(editing.selected_services ?? {})) {
          initial[svcId] = { ...(initial[svcId] ?? { enabled: false }), ...state };
        }
      }
      setSelected(initial);
      setLoadingSvc(false);
    })();
  }, [apt, editing]);

  const baseAmount = apt?.rent_price ?? apt?.sale_price ?? 0;
  const baseLabel = apt?.rent_price
    ? "Loyer / charges de base"
    : apt?.sale_price ? "Prix de base" : "Tarif de base";

  const lines = useMemo(() => {
    const items: { key: string; label: string; total: number; detail?: string; isFree?: boolean; isCharge?: boolean }[] = [];
    items.push({ key: "base", label: baseLabel, total: baseAmount });
    if (aptExtras.charges_monthly > 0) {
      items.push({ key: "apt-charges", label: "Charges mensuelles", total: aptExtras.charges_monthly, isCharge: true });
    }
    if (aptExtras.co_ownership_fee > 0 && !aptExtras.co_ownership_included) {
      items.push({
        key: "apt-co",
        label: aptExtras.co_ownership_description || "Charges de copropriété",
        total: aptExtras.co_ownership_fee,
        isCharge: true,
      });
    }
    for (const c of aptExtras.additional) {
      if (c.is_included) continue;
      items.push({
        key: `apt-add-${c.id}`,
        label: c.label,
        total: c.amount,
        detail: c.description ?? undefined,
        isCharge: true,
      });
    }
    for (const c of charges) {
      items.push({ key: `charge-${c.id}`, label: c.label, total: c.amount, isCharge: true });
    }
    for (const s of services) {
      const sel = selected[s.service_id];
      if (!sel?.enabled) continue;
      const label = s.service?.label_fr ?? s.service?.code ?? "Service";
      // Inclus / charges
      if (s.is_free || s.from_charges) {
        items.push({ key: s.id, label, total: 0, isFree: true });
        continue;
      }
      // Restaurant
      if (isRestaurant(label) && (s.lunch_price || s.dinner_price)) {
        const lunchFreq = sel.lunchPerWeek ?? 0;
        const dinnerFreq = sel.dinnerPerWeek ?? 0;
        const lunchCost = (s.lunch_price ?? 0) * lunchFreq * WEEKS_PER_MONTH;
        const dinnerCost = (s.dinner_price ?? 0) * dinnerFreq * WEEKS_PER_MONTH;
        const total = Math.round(lunchCost + dinnerCost);
        const detail = [
          lunchFreq > 0 && s.lunch_price ? `Déjeuner ${s.lunch_price}€ × ${lunchFreq} par semaine` : null,
          dinnerFreq > 0 && s.dinner_price ? `Dîner ${s.dinner_price}€ × ${dinnerFreq} par semaine` : null,
        ].filter(Boolean).join(" + ");
        items.push({ key: s.id, label, total, detail });
        continue;
      }
      // Normal optional service
      const price = s.price ?? 0;
      const unit = s.price_unit;
      let total = 0;
      let detail = "";
      if (isFixedMonthly(unit)) {
        total = Math.round(monthlyFromUnit(price, unit, 0, "week"));
        detail = `${price}€ ${unit}`;
      } else if (needsFrequency(unit)) {
        const freq = sel.freq ?? 0;
        const kind = sel.freqKind ?? "week";
        total = Math.round(monthlyFromUnit(price, unit, freq, kind));
        detail = `${price}€ ${unit} × ${freq} ${kind === "week" ? "fois par semaine" : "fois par mois"}`;
      } else {
        total = price;
      }
      items.push({ key: s.id, label, total, detail });
    }
    return items;
  }, [services, charges, selected, baseAmount, baseLabel, aptExtras]);

  const totalMonth = useMemo(() => lines.reduce((acc, l) => acc + l.total, 0), [lines]);
  const totalYear = useMemo(() => totalMonth * 12, [totalMonth]);

  // ----- Save simulation -----
  const [saveOpen, setSaveOpen] = useState(false);
  const [simName, setSimName] = useState(editing?.name ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setSimName(editing?.name ?? ""); }, [editing?.id]);

  const handleSave = async () => {
    if (!user || !apt) return;
    const name = simName.trim();
    if (!name) { toast.error("Donnez un nom à votre simulation"); return; }
    setSaving(true);
    // Strip non-serializable empty values
    const payload = {
      user_id: user.id,
      name,
      apartment_id: apt.id,
      selected_services: JSON.parse(JSON.stringify(selected)),
      total_monthly: Math.round(totalMonth),
      total_annual: Math.round(totalYear),
    };
    let error;
    if (editing?.id) {
      ({ error } = await supabase
        .from("budget_simulations")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("budget_simulations").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Simulation enregistrée ✓");
    setSaveOpen(false);
    notifySimulationsChanged();
    onSaved?.();
  };

  if (apartments.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-base">
            Enregistrez des logements depuis la recherche pour les simuler ici.
          </p>
          <Button asChild>
            <Link to="/appartements">Explorer les logements →</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Logement à simuler ({apartments.length}/{SIMULATOR_MAX})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Logement à simuler" className="space-y-2">
              {apartments.map((a) => {
                const isSel = a.id === selectedId;
                const priceLine = a.rent_price
                  ? `Loyer : ${a.rent_price.toLocaleString("fr-BE")} €/mois`
                  : a.sale_price
                  ? `Prix : ${a.sale_price.toLocaleString("fr-BE")} €`
                  : "Prix sur demande";
                return (
                  <div
                    key={a.id}
                    className={`relative w-full rounded-lg border transition-colors flex items-start gap-3 ${
                      isSel
                        ? "border-l-4 border-l-primary border-primary/40 bg-primary/5"
                        : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      onClick={() => setSelectedId(a.id)}
                      className="flex-1 min-w-0 text-left p-4 flex items-start gap-3"
                    >
                      <span
                        className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSel ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSel && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="block font-semibold break-words">
                          {a.residence_nom_fr}
                          {a.type ? ` — ${a.type}` : ""}
                          {a.surface_m2 ? ` ${a.surface_m2} m²` : ""}
                        </span>
                        <span className="block text-sm text-muted-foreground break-words">
                          {[a.ville].filter(Boolean).join(" · ")}
                        </span>
                        <span className="block text-sm">{priceLine}</span>
                      </span>
                    </button>
                    {onRemove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onRemove(a.id);
                        }}
                        aria-label={`Retirer ${a.residence_nom_fr} du simulateur`}
                        className="shrink-0 mr-2 mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Les logements retirés restent dans Mes logements.
            </p>
          </CardContent>
        </Card>




        <Card>
          <CardHeader><CardTitle className="text-lg">Services</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loadingSvc && <p className="text-muted-foreground">Chargement…</p>}
            {!loadingSvc && services.length === 0 && (
              <p className="text-muted-foreground">Aucun service renseigné pour cette résidence.</p>
            )}
            {services.map((s) => {
              const label = s.service?.label_fr ?? s.service?.code ?? "Service";
              const sel = selected[s.service_id] ?? { enabled: false };
              const incluse = s.is_free || s.from_charges;
              const restaurant = isRestaurant(label) && (s.lunch_price || s.dinner_price);
              const fixed = isFixedMonthly(s.price_unit);
              const setSel = (v: Partial<SelectedState[string]>) =>
                setSelected((m) => ({
                  ...m,
                  [s.service_id]: { ...(m[s.service_id] ?? { enabled: false }), ...v },
                }));

              return (
                <div key={s.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {incluse ? (
                        <span className="inline-flex h-5 w-9 items-center rounded-full bg-primary px-1">
                          <span className="h-3.5 w-3.5 rounded-full bg-white translate-x-3.5" />
                        </span>
                      ) : (
                        <Switch
                          checked={sel.enabled}
                          onCheckedChange={(v) => setSel({ enabled: v })}
                          id={`svc-${s.id}`}
                        />
                      )}
                      <Label htmlFor={`svc-${s.id}`} className="text-base font-medium cursor-pointer break-words">
                        {label}
                      </Label>
                    </div>
                    {incluse ? (
                      <span className="text-sm rounded-full bg-green-100 text-green-700 px-2.5 py-1 font-medium whitespace-nowrap">
                        {s.from_charges ? "Inclus dans les charges" : "Inclus"}
                      </span>
                    ) : restaurant ? (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {s.lunch_price ? `Déjeuner ~${s.lunch_price}€` : ""}
                        {s.lunch_price && s.dinner_price ? " / " : ""}
                        {s.dinner_price ? `Dîner ~${s.dinner_price}€` : ""} par repas
                      </span>
                    ) : s.price != null && s.price > 0 && s.price_unit ? (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {s.price.toLocaleString("fr-BE")} € {s.price_unit}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground whitespace-nowrap italic">Prix sur demande</span>
                    )}
                  </div>

                  {!incluse && sel.enabled && restaurant && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {s.lunch_price ? (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Déjeuners par semaine</Label>
                          <Select
                            value={String(sel.lunchPerWeek ?? 0)}
                            onValueChange={(v) => setSel({ lunchPerWeek: Number(v) })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[0,1,2,3,4,5,6,7].map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                      {s.dinner_price ? (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Dîners par semaine</Label>
                          <Select
                            value={String(sel.dinnerPerWeek ?? 0)}
                            onValueChange={(v) => setSel({ dinnerPerWeek: Number(v) })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[0,1,2,3,4,5,6,7].map((n) => (
                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {!incluse && sel.enabled && !restaurant && needsFrequency(s.price_unit) && (
                    <FrequencySelector
                      unit={s.price_unit!}
                      freq={sel.freq ?? 1}
                      freqKind={sel.freqKind ?? "week"}
                      onChange={(freq, freqKind) => setSel({ freq, freqKind })}
                    />
                  )}

                  {!incluse && sel.enabled && fixed && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Coût fixe ajouté au budget mensuel.
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <Card>
          <CardHeader><CardTitle className="text-lg">Estimation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y text-sm">
              {lines.map((l) => (
                <li key={l.key} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{l.label}</div>
                    {l.detail && <div className="text-xs text-muted-foreground">{l.detail}</div>}
                    {l.isFree && <div className="text-xs text-green-700">Inclus</div>}
                  </div>
                  <div className="whitespace-nowrap font-semibold">
                    {l.total.toLocaleString("fr-BE")} €
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total par mois</span>
                <span className="font-display font-bold text-primary">
                  {totalMonth.toLocaleString("fr-BE")} €
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total par an</span>
                <span>{totalYear.toLocaleString("fr-BE")} €</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic pt-2">
              Estimation indicative, à confirmer avec la résidence.
            </p>
            <Button
              type="button"
              className="w-full mt-2"
              disabled={!apt || !user}
              onClick={() => {
                setSimName(editing?.name ?? simName);
                setSaveOpen(true);
              }}
            >
              <Save className="h-4 w-4" />
              {editing ? "Mettre à jour la simulation" : "Enregistrer cette simulation"}
            </Button>
          </CardContent>
        </Card>
      </aside>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Mettre à jour la simulation" : "Enregistrer cette simulation"}
            </DialogTitle>
            <DialogDescription>
              Donnez un nom à votre simulation pour la retrouver dans l'historique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sim-name">Nom de la simulation</Label>
            <Input
              id="sim-name"
              value={simName}
              maxLength={120}
              placeholder="ex: Studio Les Roses - budget serré"
              onChange={(e) => setSimName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function FrequencySelector({
  unit, freq, freqKind, onChange,
}: {
  unit: PriceUnit;
  freq: number;
  freqKind: "week" | "month";
  onChange: (freq: number, freqKind: "week" | "month") => void;
}) {
  const [customMode, setCustomMode] = useState(false);
  const options = [1, 2, 3, 4, 5];
  const label =
    freqKind === "week" ? "Combien de fois par semaine ?" : "Combien de fois par mois ?";

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm">{label}</Label>
        <Select value={freqKind} onValueChange={(v) => onChange(freq, v as "week" | "month")}>
          <SelectTrigger className="w-auto h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">par semaine</SelectItem>
            <SelectItem value="month">par mois</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {customMode ? (
        <Input
          type="number"
          min={1}
          value={freq}
          onChange={(e) => onChange(Number(e.target.value || 1), freqKind)}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n, freqKind)}
              className={`h-9 min-w-[2.5rem] rounded-md border px-3 text-sm ${
                freq === n ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="h-9 rounded-md border px-3 text-sm bg-background hover:bg-accent"
          >
            autre
          </button>
        </div>
      )}
    </div>
  );
}
