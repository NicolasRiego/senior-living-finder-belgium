import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Home, Info } from "lucide-react";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label]),
);

type Apt = {
  id: string;
  type: string;
  surface_m2: number | null;
  transaction_type: string;
  rent_price: number | null;
  sale_price: number | null;
  status: string;
  available_from: string | null;
  wheelchair_accessible: boolean;
};

type Summary = {
  type: string;
  total: number;
  available: number;
  availableNow: number;
  surfaceMin: number | null;
  surfaceMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  saleMin: number | null;
  hasRent: boolean;
  hasSale: boolean;
  pmr: number;
};

export default function UnitsStep({ residence, onChange }: StepProps) {
  const [apts, setApts] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("apartments")
        .select(
          "id, type, surface_m2, transaction_type, rent_price, sale_price, status, available_from, wheelchair_accessible",
        )
        .eq("residence_id", residence.id)
        .order("type");
      if (cancelled) return;
      const list = (data ?? []) as Apt[];
      setApts(list);

      const total = list.length;
      if (total !== residence.capacity) {
        await supabase.from("residences").update({ capacity: total }).eq("id", residence.id);
        onChange?.({ capacity: total });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [residence.id]);

  const summaries = useMemo<Summary[]>(() => {
    const map: Record<string, Summary> = {};
    for (const a of apts) {
      if (!map[a.type]) {
        map[a.type] = {
          type: a.type,
          total: 0,
          available: 0,
          availableNow: 0,
          surfaceMin: null,
          surfaceMax: null,
          rentMin: null,
          rentMax: null,
          saleMin: null,
          hasRent: false,
          hasSale: false,
          pmr: 0,
        };
      }
      const s = map[a.type];
      s.total++;
      if (a.status === "available") {
        s.available++;
        if (!a.available_from || new Date(a.available_from) <= new Date()) {
          s.availableNow++;
        }
      }
      if (a.surface_m2) {
        s.surfaceMin = s.surfaceMin === null ? a.surface_m2 : Math.min(s.surfaceMin, a.surface_m2);
        s.surfaceMax = s.surfaceMax === null ? a.surface_m2 : Math.max(s.surfaceMax, a.surface_m2);
      }
      if (a.rent_price && ["rent", "both"].includes(a.transaction_type)) {
        s.hasRent = true;
        s.rentMin = s.rentMin === null ? a.rent_price : Math.min(s.rentMin, a.rent_price);
        s.rentMax = s.rentMax === null ? a.rent_price : Math.max(s.rentMax, a.rent_price);
      }
      if (a.sale_price && ["sale", "both"].includes(a.transaction_type)) {
        s.hasSale = true;
        s.saleMin = s.saleMin === null ? a.sale_price : Math.min(s.saleMin, a.sale_price);
      }
      if (a.wheelchair_accessible) s.pmr++;
    }
    return Object.values(map).sort((a, b) => a.type.localeCompare(b.type));
  }, [apts]);

  const availableTotal = apts.filter((a) => a.status === "available").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Étape 3 — Logements</CardTitle>
        <Button asChild variant="outline">
          <Link to={`/partenaire/residences/${residence.id}/appartements`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Gérer les appartements
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-medium">Vue synchronisée automatiquement</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ces données sont calculées en temps réel depuis vos appartements. Pour modifier,
              utilisez « Gérer les appartements ».
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard value={apts.length} label="Total logements" />
          <StatCard value={availableTotal} label="Disponibles" />
          <StatCard value={summaries.length} label="Types différents" />
        </div>

        {loading ? (
          <p className="text-muted-foreground py-6 text-center">Chargement…</p>
        ) : summaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
            <Home className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden />
            <p className="font-medium text-lg">Aucun appartement enregistré</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ajoutez des appartements pour voir les logements apparaître ici et sur la fiche
              publique.
            </p>
            <Button asChild className="mt-2">
              <Link to={`/partenaire/residences/${residence.id}/appartements`}>
                + Ajouter des appartements
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {summaries.map((s) => (
              <SummaryCard key={s.type} s={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-3xl font-display font-semibold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function SummaryCard({ s }: { s: Summary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">{TYPE_LABEL[s.type] ?? s.type}</h3>
        <div className="flex flex-wrap gap-1.5">
          {s.hasRent && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              À louer
            </span>
          )}
          {s.hasSale && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              À vendre
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Row label="Total" value={`${s.total} logement${s.total > 1 ? "s" : ""}`} />
        <Row label="Disponibles" value={`${s.available} / ${s.total}`} />
        {(s.surfaceMin || s.surfaceMax) && (
          <Row
            label="Surface"
            value={
              s.surfaceMin === s.surfaceMax
                ? `${s.surfaceMin} m²`
                : `${s.surfaceMin}–${s.surfaceMax} m²`
            }
          />
        )}
        {s.hasRent && s.rentMin && (
          <Row
            label="Loyer"
            value={
              s.rentMin === s.rentMax || !s.rentMax
                ? `${s.rentMin.toLocaleString("fr-BE")} €/mois`
                : `${s.rentMin.toLocaleString("fr-BE")}–${s.rentMax.toLocaleString("fr-BE")} €/mois`
            }
          />
        )}
        {s.hasSale && s.saleMin && (
          <Row label="Achat dès" value={`${s.saleMin.toLocaleString("fr-BE")} €`} />
        )}
        {s.pmr > 0 && (
          <Row label="Accessibles PMR" value={`${s.pmr} logement${s.pmr > 1 ? "s" : ""}`} />
        )}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}
