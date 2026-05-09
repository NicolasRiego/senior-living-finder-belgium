import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label])
);

type UnitSummary = {
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

export default function ResidencePreview() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [unitSummaries, setUnitSummaries] = useState<UnitSummary[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ url: string; alt: string; cover: boolean }[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [r, apts, s, ph] = await Promise.all([
        supabase.from("residences").select("*").eq("id", id).single(),
        supabase
          .from("apartments")
          .select(
            `type, surface_m2, transaction_type, rent_price, sale_price, status, available_from, wheelchair_accessible`
          )
          .eq("residence_id", id)
          .neq("status", "unavailable")
          .order("type"),
        supabase
          .from("residence_services")
          .select("*, services_catalog(*)")
          .eq("residence_id", id),
        supabase.from("photos").select("*").eq("residence_id", id).order("display_order"),
      ]);

      setData(r.data);
      setServices(s.data ?? []);

      // Summaries par type
      const aptList = apts.data ?? [];
      const map: Record<string, UnitSummary> = {};
      for (const a of aptList as any[]) {
        if (!a.type) continue;
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
        const su = map[a.type];
        su.total++;
        if (a.status === "available") {
          su.available++;
          if (!a.available_from) su.availableNow++;
        }
        if (a.surface_m2) {
          su.surfaceMin = su.surfaceMin === null ? a.surface_m2 : Math.min(su.surfaceMin, a.surface_m2);
          su.surfaceMax = su.surfaceMax === null ? a.surface_m2 : Math.max(su.surfaceMax, a.surface_m2);
        }
        if (a.rent_price && ["rent", "both"].includes(a.transaction_type)) {
          su.hasRent = true;
          su.rentMin = su.rentMin === null ? a.rent_price : Math.min(su.rentMin, a.rent_price);
          su.rentMax = su.rentMax === null ? a.rent_price : Math.max(su.rentMax, a.rent_price);
        }
        if (a.sale_price && ["sale", "both"].includes(a.transaction_type)) {
          su.hasSale = true;
          su.saleMin = su.saleMin === null ? a.sale_price : Math.min(su.saleMin, a.sale_price);
        }
        if (a.wheelchair_accessible) su.pmr++;
      }
      setUnitSummaries(Object.values(map).sort((a, b) => a.type.localeCompare(b.type)));

      // Photos
      const out: { url: string; alt: string; cover: boolean }[] = [];
      for (const p of ph.data ?? []) {
        const { data: signed } = await supabase.storage
          .from("residence-photos")
          .createSignedUrl(p.storage_path, 3600);
        if (signed?.signedUrl)
          out.push({ url: signed.signedUrl, alt: p.alt_text ?? "", cover: p.category === "cover" });
      }
      setPhotos(out);
    })();
  }, [id]);

  if (!data) return <div className="container py-12">Chargement…</div>;
  const cover = photos.find((p) => p.cover) ?? photos[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-amber-50 border-b border-amber-200 py-3">
        <div className="container flex items-center justify-between">
          <p className="text-amber-900">
            👁 Aperçu privé — cette fiche n'est pas encore publiée
          </p>
          <Button variant="outline" asChild>
            <Link to={`/partenaire/residences/${id}/edition`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'édition
            </Link>
          </Button>
        </div>
      </div>

      {cover && (
        <div className="relative h-[420px] bg-muted">
          <img src={cover.url} alt={cover.alt} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container py-10 space-y-8 max-w-4xl">
        <header>
          <h1 className="font-display text-5xl">{data.nom_fr}</h1>
          {data.tagline_fr && <p className="text-2xl text-muted-foreground mt-2">{data.tagline_fr}</p>}
          {data.adresse && (
            <p className="mt-3 flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {data.adresse}, {data.code_postal} {data.ville}
            </p>
          )}
        </header>

        {data.description_fr && (
          <section className="prose max-w-none">
            <h2 className="font-display text-2xl">Présentation</h2>
            <p className="text-lg leading-relaxed whitespace-pre-line">{data.description_fr}</p>
          </section>
        )}

        {unitSummaries.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-4">Logements & tarifs</h2>

            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {unitSummaries.reduce((t, s) => t + s.total, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total logements</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {unitSummaries.reduce((t, s) => t + s.available, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Disponibles</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                <div className="text-3xl font-bold">{unitSummaries.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Types différents</div>
              </div>
            </div>

            {/* Cards par type */}
            <div className="space-y-3">
              {unitSummaries.map((s) => (
                <div key={s.type} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">
                      {TYPE_LABEL[s.type] ?? s.type}
                    </h3>
                    <div className="flex gap-1.5">
                      {s.hasRent && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                          À louer
                        </span>
                      )}
                      {s.hasSale && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700 font-medium">
                          À vendre
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Total
                      </div>
                      <div className="font-semibold">
                        {s.total} logement{s.total > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Disponibles
                      </div>
                      <div className="font-semibold text-green-600">
                        {s.available} / {s.total}
                      </div>
                    </div>
                    {(s.surfaceMin || s.surfaceMax) && (
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                          Surface
                        </div>
                        <div className="font-semibold">
                          {s.surfaceMin === s.surfaceMax
                            ? `${s.surfaceMin} m²`
                            : `${s.surfaceMin}–${s.surfaceMax} m²`}
                        </div>
                      </div>
                    )}
                    {s.hasRent && s.rentMin && (
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                          Loyer
                        </div>
                        <div className="font-semibold text-primary">
                          {s.rentMin === s.rentMax || !s.rentMax
                            ? `${s.rentMin.toLocaleString("fr-BE")} €/mois`
                            : `${s.rentMin.toLocaleString("fr-BE")}–${s.rentMax.toLocaleString("fr-BE")} €/mois`}
                        </div>
                      </div>
                    )}
                    {s.hasSale && s.saleMin && (
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                          Achat dès
                        </div>
                        <div className="font-semibold">
                          {s.saleMin.toLocaleString("fr-BE")} €
                        </div>
                      </div>
                    )}
                    {s.pmr > 0 && (
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                          PMR
                        </div>
                        <div className="font-semibold">
                          {s.pmr} logement{s.pmr > 1 ? "s" : ""}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Services</h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {services.map((s: any) => (
                <li key={s.id} className="text-lg">• {s.services_catalog?.label_fr}</li>
              ))}
            </ul>
          </section>
        )}

        {photos.length > 1 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Photos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.map((p, i) => (
                <img key={i} src={p.url} alt={p.alt} className="aspect-video w-full object-cover rounded-lg" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
