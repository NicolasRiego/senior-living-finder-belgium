import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { SavedApartment } from "./savedApartments";

type ServiceRow = {
  id: string;
  service_id: string;
  price: number | null;
  included: boolean;
  optional: boolean;
  is_free: boolean;
  from_charges: boolean;
  charges_label: string | null;
  service: { code: string; label_fr: string; category: string | null } | null;
};

type ChargeRow = { id: string; label: string; amount: number };

type FreqKind = "meals" | "perWeek" | "perMonth" | "sessionsWeek" | "fixed";

const FREQ_BY_CODE: Record<string, FreqKind> = {
  repas: "meals",
  restaurant: "meals",
  coiffeur: "perMonth",
  pedicure: "perMonth",
  kine: "sessionsWeek",
  infirmier: "sessionsWeek",
  soins: "sessionsWeek",
  menage: "perWeek",
  linge: "perWeek",
  blanchisserie: "perWeek",
  navette: "perWeek",
  transport: "perWeek",
  jardinage: "perWeek",
  parking: "fixed",
  wifi: "fixed",
  securite: "fixed",
  reception: "fixed",
  piscine: "fixed",
  salle_sport: "fixed",
};

type SelectedState = Record<string, {
  enabled: boolean;
  mealsPerDay?: number;
  daysPerWeek?: number;
  perWeek?: number;
  perMonth?: number;
}>;

function defaultsForKind(kind: FreqKind) {
  switch (kind) {
    case "meals": return { mealsPerDay: 1, daysPerWeek: 5 };
    case "perWeek": return { perWeek: 1 };
    case "perMonth": return { perMonth: 1 };
    case "sessionsWeek": return { perWeek: 2 };
    case "fixed": return {};
  }
}

function unitsPerMonth(kind: FreqKind, s: SelectedState[string]): number {
  switch (kind) {
    case "meals":
      return (s.mealsPerDay ?? 0) * (s.daysPerWeek ?? 0) * 4;
    case "perWeek":
    case "sessionsWeek":
      return (s.perWeek ?? 0) * 4;
    case "perMonth":
      return s.perMonth ?? 0;
    case "fixed":
      return 1;
  }
}

function unitLabel(kind: FreqKind): string {
  switch (kind) {
    case "meals": return "/repas";
    case "perWeek":
    case "sessionsWeek": return "/séance";
    case "perMonth": return "/passage";
    case "fixed": return "/mois";
  }
}

export function BudgetSimulator({
  apartments,
  initialId,
}: {
  apartments: SavedApartment[];
  initialId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId ?? apartments[0]?.id ?? null,
  );
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

  useEffect(() => {
    if (!apt) { setServices([]); setCharges([]); return; }
    setLoadingSvc(true);
    setSelected({});
    (async () => {
      const [svcData, chargesData] = await Promise.all([
        supabase
          .from("residence_services")
          .select("id, service_id, price, included, optional, is_free, from_charges, charges_label, service:services_catalog(code,label_fr,category)")
          .eq("residence_id", apt.residence_id)
          .eq("included", true),
        supabase
          .from("residence_charges")
          .select("id, label, amount")
          .eq("residence_id", apt.residence_id)
          .eq("is_mandatory", true)
          .gt("amount", 0)
          .neq("label", "Nouveau service"),
      ]);
      setServices((svcData.data ?? []) as unknown as ServiceRow[]);
      setCharges((chargesData.data ?? []) as ChargeRow[]);
      setLoadingSvc(false);
    })();
  }, [apt]);

  const baseAmount = apt?.rent_price ?? apt?.sale_price ?? 0;
  const baseLabel = apt?.rent_price
    ? "Loyer / charges de base"
    : apt?.sale_price ? "Prix de base" : "Tarif de base";

  const lines = useMemo(() => {
    const items: { key: string; label: string; total: number; detail?: string; isFree?: boolean; isCharge?: boolean }[] = [];
    items.push({ key: "base", label: baseLabel, total: baseAmount });
    for (const c of charges) {
      items.push({ key: `charge-${c.id}`, label: c.label, total: c.amount, isCharge: true });
    }
    for (const s of services) {
      const code = s.service?.code ?? "";
      const kind = FREQ_BY_CODE[code] ?? "fixed";
      const sel = selected[s.service_id];
      if (!sel?.enabled) continue;
      const unitPrice = (s.is_free || s.from_charges) ? 0 : (s.price ?? 0);
      const units = unitsPerMonth(kind, sel);
      const total = Math.round(units * unitPrice);
      let detail = "";
      if (kind === "meals") detail = `${sel.mealsPerDay}×/j × ${sel.daysPerWeek}j/sem`;
      else if (kind === "perWeek" || kind === "sessionsWeek") detail = `${sel.perWeek}×/sem`;
      else if (kind === "perMonth") detail = `${sel.perMonth}×/mois`;
      items.push({
        key: s.id,
        label: s.service?.label_fr ?? code,
        total,
        detail,
        isFree: s.is_free || s.from_charges,
      });
    }
    return items;
  }, [services, charges, selected, baseAmount, baseLabel]);

  const totalMonth = useMemo(() => lines.reduce((acc, l) => acc + l.total, 0), [lines]);
  const totalYear = useMemo(() => totalMonth * 12, [totalMonth]);

  if (apartments.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-base">
            Vous devez d'abord enregistrer un appartement pour le simuler.
          </p>
          <Button asChild><Link to="/appartements">Voir les appartements</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logement à simuler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedId ?? ""} onValueChange={(v) => setSelectedId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un appartement" />
              </SelectTrigger>
              <SelectContent>
                {apartments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.residence_nom_fr} — {a.type ?? "logement"} {a.surface_m2 ? `${a.surface_m2} m²` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {apt && (
              <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
                <div className="font-semibold text-base">{apt.residence_nom_fr}</div>
                <div className="text-muted-foreground">
                  {[apt.type, apt.surface_m2 && `${apt.surface_m2} m²`, apt.ville].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1">
                  {apt.rent_price
                    ? <>Loyer : <strong>{apt.rent_price.toLocaleString("fr-BE")} €</strong>/mois</>
                    : apt.sale_price
                    ? <>Prix : <strong>{apt.sale_price.toLocaleString("fr-BE")} €</strong></>
                    : <span className="text-muted-foreground">Prix sur demande</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingSvc && <p className="text-muted-foreground">Chargement…</p>}
            {!loadingSvc && services.length === 0 && (
              <p className="text-muted-foreground">Aucun service renseigné pour cette résidence.</p>
            )}
            {services.map((s) => {
              const code = s.service?.code ?? "";
              const kind = FREQ_BY_CODE[code] ?? "fixed";
              const sel = selected[s.service_id] ?? { enabled: false };
              const isFreeOrIncluded = s.is_free || s.from_charges;
              const setSel = (v: Partial<SelectedState[string]>) =>
                setSelected((m) => ({
                  ...m,
                  [s.service_id]: { ...(m[s.service_id] ?? { enabled: false }), ...v },
                }));
              return (
                <div key={s.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch
                        checked={sel.enabled}
                        onCheckedChange={(v) => {
                          if (v) setSel({ enabled: true, ...defaultsForKind(kind) });
                          else setSel({ enabled: false });
                        }}
                        id={`svc-${s.id}`}
                      />
                      <Label htmlFor={`svc-${s.id}`} className="text-base font-medium cursor-pointer break-words">
                        {s.service?.label_fr}
                      </Label>
                    </div>
                    {isFreeOrIncluded ? (
                      <span className="text-sm rounded-full bg-green-100 text-green-700 px-2.5 py-1 font-medium whitespace-nowrap">
                        {s.from_charges ? "Inclus dans les charges" : "Gratuit"}
                      </span>
                    ) : s.price != null && s.price > 0 ? (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {s.price.toLocaleString("fr-BE")} € {unitLabel(kind)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground whitespace-nowrap italic">
                        Prix sur demande
                      </span>
                    )}
                  </div>
                  {sel.enabled && kind !== "fixed" && (
                    <FrequencyControls kind={kind} sel={sel} setSel={setSel} />
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
                <span className="font-semibold">Total / mois</span>
                <span className="font-display font-bold text-primary">
                  {totalMonth.toLocaleString("fr-BE")} €
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total / an</span>
                <span>{totalYear.toLocaleString("fr-BE")} €</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic pt-2">
              Estimation indicative, à confirmer avec la résidence.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function FrequencyControls({
  kind, sel, setSel,
}: {
  kind: FreqKind;
  sel: SelectedState[string];
  setSel: (v: Partial<SelectedState[string]>) => void;
}) {
  if (kind === "meals") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Repas/jour</Label>
          <Select
            value={String(sel.mealsPerDay ?? 1)}
            onValueChange={(v) => setSel({ mealsPerDay: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Jours/semaine</Label>
          <Select
            value={String(sel.daysPerWeek ?? 5)}
            onValueChange={(v) => setSel({ daysPerWeek: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }
  if (kind === "perMonth") {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Fréquence par mois</Label>
        <Select
          value={String(sel.perMonth ?? 1)}
          onValueChange={(v) => setSel({ perMonth: Number(v) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1×/mois</SelectItem>
            <SelectItem value="2">2×/mois</SelectItem>
            <SelectItem value="4">4×/mois</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (kind === "fixed") return null;
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Fréquence par semaine</Label>
      <Select
        value={String(sel.perWeek ?? 1)}
        onValueChange={(v) => setSel({ perWeek: Number(v) })}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {[1,2,3,4,5,6,7].map((n) => (
            <SelectItem key={n} value={String(n)}>{n}×/sem</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
