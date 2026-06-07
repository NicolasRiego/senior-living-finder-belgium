import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Check,
  MapPin,
  GitCompare,
  Mail,
  Share2,
  Plus,
  Building2,
  Home,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import {
  fetchCompareItems,
  fetchServicesLabels,
  fetchActivitiesLabels,
} from "@/modules/residences/compareApi";
import {
  fetchCompareApartments,
  type CompareAptItem,
} from "@/modules/apartments/compareApartmentsApi";

const TYPE_LABEL_KEY = (t: string) => `residenceTypes.${t}`;
const LABEL_COL = "w-44 shrink-0";

export default function ComparePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { ids, remove, clear, setIds, aptIds, removeApt, clearApt } = useCompare();
  const [sp, setSp] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"residences" | "logements">("residences");

  useEffect(() => {
    if (ids.length === 0 && aptIds.length > 0) setActiveTab("logements");
    if (aptIds.length === 0 && ids.length > 0) setActiveTab("residences");
  }, [ids.length, aptIds.length]);

  // Hydrate from URL on first load
  useEffect(() => {
    const fromUrl = (sp.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (fromUrl.length > 0) {
      const merged = Array.from(new Set([...fromUrl, ...ids])).slice(0, 4);
      if (JSON.stringify(merged) !== JSON.stringify(ids)) setIds(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL when ids change
  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (ids.length) next.set("ids", ids.join(","));
    else next.delete("ids");
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  const query = useQuery({
    queryKey: ["compare-items", ids],
    queryFn: () => fetchCompareItems(ids),
    enabled: ids.length > 0,
  });

  const aptQuery = useQuery({
    queryKey: ["compare-apartments", aptIds],
    queryFn: () => fetchCompareApartments(aptIds),
    enabled: aptIds.length > 0,
  });

  const items = query.data ?? [];
  const aptItems = aptQuery.data ?? [];

  const allServiceCodes = useMemo(
    () => Array.from(new Set(items.flatMap((i) => Array.from(i.service_codes)))),
    [items],
  );
  const allActivityCodes = useMemo(
    () => Array.from(new Set(items.flatMap((i) => Array.from(i.activity_codes)))),
    [items],
  );

  const serviceLabels = useQuery({
    queryKey: ["service-labels", allServiceCodes],
    queryFn: () => fetchServicesLabels(allServiceCodes),
    enabled: allServiceCodes.length > 0,
  });
  const activityLabels = useQuery({
    queryKey: ["activity-labels", allActivityCodes],
    queryFn: () => fetchActivitiesLabels(allActivityCodes),
    enabled: allActivityCodes.length > 0,
  });

  const share = async () => {
    const url = `${window.location.origin}/comparateur?ids=${ids.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Lien copié", description: "Vous pouvez le partager." });
    } catch {
      toast({ title: "Lien", description: url });
    }
  };

  if (ids.length === 0 && aptIds.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
          <GitCompare className="mx-auto h-12 w-12 text-primary mb-6" />
          <h1 className="font-display text-3xl font-semibold">Comparateur</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Ajoutez des résidences ou des logements à comparer côte à côte.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-center space-y-3">
              <Building2 className="mx-auto h-8 w-8 text-primary" />
              <p className="font-semibold">Résidences</p>
              <p className="text-sm text-muted-foreground">Comparez jusqu'à 3 résidences</p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/residences">Parcourir les résidences</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-center space-y-3">
              <Home className="mx-auto h-8 w-8 text-primary" />
              <p className="font-semibold">Logements</p>
              <p className="text-sm text-muted-foreground">Comparez jusqu'à 3 logements</p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/appartements">Parcourir les logements</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLoading =
    (ids.length > 0 && query.isLoading) || (aptIds.length > 0 && aptQuery.isLoading);
  if (isLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="container py-12 lg:py-16">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Comparateur</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("residences")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                activeTab === "residences"
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Résidences
              {ids.length > 0 && (
                <span
                  className={`ml-1 h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${
                    activeTab === "residences" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {ids.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("logements")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                activeTab === "logements"
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              Logements
              {aptIds.length > 0 && (
                <span
                  className={`ml-1 h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${
                    activeTab === "logements" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {aptIds.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            {activeTab === "residences" ? (
              <>
                {ids.length < 4 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/residences">
                      <Plus className="h-4 w-4" /> Ajouter
                    </Link>
                  </Button>
                )}
                {ids.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clear}>
                    Vider
                  </Button>
                )}
              </>
            ) : (
              <>
                {aptIds.length < 4 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/appartements">
                      <Plus className="h-4 w-4" /> Ajouter
                    </Link>
                  </Button>
                )}
                {aptIds.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearApt}>
                    Vider
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="h-4 w-4" /> Partager
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ SECTION RÉSIDENCES ═══ */}
      {activeTab === "residences" && (
        ids.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-10 text-center mt-8">
            <p className="text-muted-foreground mb-4">Aucune résidence dans le comparateur.</p>
            <Button asChild variant="outline">
              <Link to="/residences">Parcourir les résidences</Link>
            </Button>
          </div>
        ) : (
        <section className="mt-8">
          {items.length < 2 && items.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Sélectionnez au moins 2 résidences pour activer la comparaison complète.
            </div>
          )}

          <div className="overflow-x-auto pb-2">
            <div className="min-w-fit">
              {/* En-tête : photos + noms (avec VS si 2 items) */}
              <ColumnHeaders
                items={items.map((r) => ({
                  id: r.id,
                  cover_url: r.cover_url,
                  title: r.nom_fr,
                  subtitle: [r.ville, r.region].filter(Boolean).join(" · "),
                  href: `/residences/${r.slug}`,
                  onRemove: () => remove(r.id),
                }))}
              />

              {/* Sections */}
              <SectionTitle label="Général" count={items.length} />
              <DataRow label={t("common.type")} count={items.length} index={0}>
                {items.map((r) => (
                  <CellText key={r.id}>{t(TYPE_LABEL_KEY(r.type_etablissement))}</CellText>
                ))}
              </DataRow>
              <DataRow label="Localisation" count={items.length} index={1}>
                {items.map((r) => (
                  <CellText key={r.id}>
                    {[r.ville, r.region].filter(Boolean).join(" · ") || <Dash />}
                  </CellText>
                ))}
              </DataRow>
              <DataRow label="Capacité" count={items.length} index={2}>
                {items.map((r) => (
                  <CellText key={r.id}>{r.capacity ?? <Dash />}</CellText>
                ))}
              </DataRow>

              <SectionTitle label="Budget mensuel" count={items.length} />
              <DataRow label="Loyer minimum (hors consommations)" count={items.length} index={0}>
                {items.map((r) => (
                  <div key={r.id} className="text-center">
                    {r.rent_from != null ? (
                      <PriceStrong value={`${Number(r.rent_from).toLocaleString("fr-BE")} €/mois`} />
                    ) : (
                      <Dash />
                    )}
                  </div>
                ))}
              </DataRow>
              <DataRow label="Forfait services de base" count={items.length} index={1}>
                {items.map((r) => (
                  <CellText key={r.id}>
                    {r.mandatory_charges_count === 0 ? (
                      <Dash />
                    ) : r.mandatory_charges_total === 0 ? (
                      "Inclus"
                    ) : (
                      `${r.mandatory_charges_total.toLocaleString("fr-BE")} €/mois`
                    )}
                  </CellText>
                ))}
              </DataRow>
              <DataRow label="Coût total minimum" count={items.length} index={2}>
                {items.map((r) => {
                  if (r.rent_from == null) {
                    return (
                      <div key={r.id} className="text-center font-bold text-primary">
                        <Dash />
                      </div>
                    );
                  }
                  const total = Number(r.rent_from) + (r.mandatory_charges_total || 0);
                  return (
                    <div key={r.id} className="text-center">
                      <span className="inline-block rounded-md bg-primary/10 px-3 py-1 font-bold text-primary">
                        {total.toLocaleString("fr-BE")} €/mois
                      </span>
                    </div>
                  );
                })}
              </DataRow>


              <SectionTitle label="Surfaces & logements" count={items.length} />
              <DataRow label="Surface min" count={items.length} index={0}>
                {items.map((r) => (
                  <CellText key={r.id}>{r.surface_min != null ? `${r.surface_min} m²` : <Dash />}</CellText>
                ))}
              </DataRow>
              <DataRow label="Surface max" count={items.length} index={1}>
                {items.map((r) => (
                  <CellText key={r.id}>{r.surface_max != null ? `${r.surface_max} m²` : <Dash />}</CellText>
                ))}
              </DataRow>
              <DataRow label="Types de logements" count={items.length} index={2}>
                {items.map((r) => (
                  <CellText key={r.id} className="capitalize">
                    {r.apartment_types?.length ? r.apartment_types.join(", ") : <Dash />}
                  </CellText>
                ))}
              </DataRow>

              <SectionTitle label="Accessibilité" count={items.length} />
              <DataRow label="Accessibilité PMR" count={items.length} index={0}>
                {items.map((r) => <BoolCell key={r.id} value={r.is_pmr} />)}
              </DataRow>
              <DataRow label="Disponibilité" count={items.length} index={1}>
                {items.map((r) => <BoolCell key={r.id} value={r.has_availability} />)}
              </DataRow>

              {allServiceCodes.length > 0 && (
                <>
                  <SectionTitle label="Services" count={items.length} />
                  {allServiceCodes.map((code, idx) => (
                    <DataRow
                      key={code}
                      label={serviceLabels.data?.get(code) ?? code}
                      count={items.length}
                      index={idx}
                    >
                      {items.map((r) => <BoolCell key={r.id} value={r.service_codes.has(code)} />)}
                    </DataRow>
                  ))}
                </>
              )}

              {allActivityCodes.length > 0 && (
                <>
                  <SectionTitle label="Activités" count={items.length} />
                  {allActivityCodes.map((code, idx) => (
                    <DataRow
                      key={code}
                      label={activityLabels.data?.get(code) ?? code}
                      count={items.length}
                      index={idx}
                    >
                      {items.map((r) => <BoolCell key={r.id} value={r.activity_codes.has(code)} />)}
                    </DataRow>
                  ))}
                </>
              )}

              <SectionTitle label="Actions" count={items.length} />
              <div className="flex gap-4 mt-4">
                <div className={LABEL_COL} />
                {items.map((r) => (
                  <div key={r.id} className="flex-1 min-w-[220px] flex flex-col gap-2">
                    <Button asChild variant="hero" size="lg" className="w-full">
                      <Link to={`/residences/${r.slug}`}>Voir la résidence</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/residences/${r.slug}#contact`}>
                        <Mail className="h-4 w-4" /> Contacter
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )
      )}

      {/* ═══ SECTION APPARTEMENTS ═══ */}
      {activeTab === "logements" && (
        aptIds.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-10 text-center mt-8">
            <p className="text-muted-foreground mb-4">Aucun logement dans le comparateur.</p>
            <Button asChild variant="outline">
              <Link to="/appartements">Parcourir les logements</Link>
            </Button>
          </div>
        ) : (
        <section className="mt-8">

          <div className="overflow-x-auto pb-2">
            <div className="min-w-fit">
              <ColumnHeaders
                items={aptItems.map((a) => ({
                  id: a.id,
                  cover_url: a.cover_url,
                  title: aptTypeLabel(a),
                  subtitle: [a.residence_nom_fr, a.residence_ville].filter(Boolean).join(" · "),
                  href: `/residences/${a.residence_slug}`,
                  onRemove: () => removeApt(a.id),
                }))}
              />

              <SectionTitle label="Identification" count={aptItems.length} />
              <DataRow label="Type" count={aptItems.length} index={0}>
                {aptItems.map((a) => <CellText key={a.id} className="capitalize">{a.type}</CellText>)}
              </DataRow>
              <DataRow label="Résidence" count={aptItems.length} index={1}>
                {aptItems.map((a) => (
                  <div key={a.id} className="text-center">
                    <Link to={`/residences/${a.residence_slug}`} className="text-sm font-medium text-primary hover:underline">
                      {a.residence_nom_fr}
                    </Link>
                  </div>
                ))}
              </DataRow>
              <DataRow label="Ville" count={aptItems.length} index={2}>
                {aptItems.map((a) => <CellText key={a.id}>{a.residence_ville || <Dash />}</CellText>)}
              </DataRow>

              <SectionTitle label="Surface & disposition" count={aptItems.length} />
              <DataRow label="Surface" count={aptItems.length} index={0}>
                {aptItems.map((a) => <CellText key={a.id}>{a.surface_m2 ? `${a.surface_m2} m²` : <Dash />}</CellText>)}
              </DataRow>
              <DataRow label="Étage" count={aptItems.length} index={1}>
                {aptItems.map((a) => (
                  <CellText key={a.id}>
                    {a.floor === 0 ? "Rez-de-chaussée" : a.floor != null ? `${a.floor}e étage` : <Dash />}
                  </CellText>
                ))}
              </DataRow>

              <SectionTitle label="Transaction & prix" count={aptItems.length} />
              <DataRow label="Type de transaction" count={aptItems.length} index={0}>
                {aptItems.map((a) => (
                  <CellText key={a.id}>
                    {a.transaction_type === "rent" ? "À louer" : a.transaction_type === "sale" ? "À vendre" : "Les deux"}
                  </CellText>
                ))}
              </DataRow>
              <DataRow label="Loyer mensuel minimum" count={aptItems.length} index={1}>
                {aptItems.map((a) => (
                  <div key={a.id} className="text-center">
                    {a.rent_price ? (
                      <PriceStrong value={`${a.rent_price.toLocaleString("fr-BE")} €/mois`} />
                    ) : (
                      <Dash />
                    )}
                  </div>
                ))}
              </DataRow>
              <DataRow label="Charges mensuelles" count={aptItems.length} index={2}>
                {aptItems.map((a) => (
                  <CellText key={a.id}>
                    {a.charges_monthly ? `${a.charges_monthly.toLocaleString("fr-BE")} €` : <Dash />}
                  </CellText>
                ))}
              </DataRow>
              <DataRow label="Prix d'achat" count={aptItems.length} index={3}>
                {aptItems.map((a) => (
                  <div key={a.id} className="text-center">
                    {a.sale_price ? (
                      <PriceStrong value={`${a.sale_price.toLocaleString("fr-BE")} €`} />
                    ) : (
                      <Dash />
                    )}
                  </div>
                ))}
              </DataRow>

              <SectionTitle label="Équipements" count={aptItems.length} />
              {([
                ["Parking", "parking"],
                ["Cave", "cave"],
                ["Terrasse", "terrace"],
                ["Jardin", "garden"],
                ["Meublé", "furnished"],
                ["Cuisine équipée", "kitchen_equipped"],
                ["Ascenseur", "elevator"],
                ["Accessible PMR", "wheelchair_accessible"],
              ] as [string, keyof CompareAptItem][]).map(([label, key], idx) => (
                <DataRow key={key} label={label} count={aptItems.length} index={idx}>
                  {aptItems.map((a) => <BoolCell key={a.id} value={Boolean(a[key])} />)}
                </DataRow>
              ))}

              <SectionTitle label="Disponibilité" count={aptItems.length} />
              <DataRow label="Statut" count={aptItems.length} index={0}>
                {aptItems.map((a) => (
                  <CellText key={a.id}>
                    {a.status === "available" ? "Disponible" : a.status === "reserved" ? "Réservé" : "Indisponible"}
                  </CellText>
                ))}
              </DataRow>
              <DataRow label="Disponible à partir du" count={aptItems.length} index={1}>
                {aptItems.map((a) => (
                  <CellText key={a.id}>
                    {a.available_from ? new Date(a.available_from).toLocaleDateString("fr-BE") : "Immédiatement"}
                  </CellText>
                ))}
              </DataRow>

              <SectionTitle label="Actions" count={aptItems.length} />
              <div className="flex gap-4 mt-4">
                <div className={LABEL_COL} />
                {aptItems.map((a) => (
                  <div key={a.id} className="flex-1 min-w-[220px] flex flex-col gap-2">
                    <Button asChild variant="hero" size="lg" className="w-full">
                      <Link to={`/appartements/${a.id}`}>Voir le logement</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/residences/${a.residence_slug}`}>Voir la résidence</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )
      )}
    </div>
  );
}

/* ═══ Helpers ═══ */

function aptTypeLabel(a: CompareAptItem) {
  if (a.type === "appartement") return "Appartement";
  if (a.type === "studio") return "Studio";
  if (a.type === "chambre") return "Chambre";
  return a.title_fr ?? a.type;
}

function SubHeader({
  title,
  count,
  unit,
  canAdd,
  addTo,
  onClear,
}: {
  title: string;
  count: number;
  unit: string;
  canAdd: boolean;
  addTo: string;
  onClear: () => void;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-muted-foreground">
          {count} {unit}
          {count > 1 ? "s sélectionnés" : " sélectionné"}
        </p>
      </div>
      <div className="flex gap-2">
        {canAdd && (
          <Button asChild variant="outline" size="sm">
            <Link to={addTo}>
              <Plus className="h-4 w-4" /> Ajouter
            </Link>
          </Button>
        )}
        {count > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Vider
          </Button>
        )}
      </div>
    </div>
  );
}

type HeaderItem = {
  id: string;
  cover_url: string | null;
  title: string;
  subtitle: string;
  href: string;
  onRemove: () => void;
};

function ColumnHeaders({ items }: { items: HeaderItem[] }) {
  const showVs = items.length === 2;
  return (
    <div className="flex gap-4 items-start">
      <div className={LABEL_COL} />
      {items.map((item, idx) => (
        <Fragment key={item.id}>
          <div className="flex-1 min-w-[220px]">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted mb-4 shadow-md">
              {item.cover_url ? (
                <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800"; }} />

              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <MapPin className="h-8 w-8" />
                </div>
              )}
              <button
                onClick={item.onRemove}
                className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 shadow hover:bg-destructive hover:text-destructive-foreground transition-colors"
                aria-label="Retirer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center px-2 mb-4">
              <Link
                to={item.href}
                className="font-display text-lg font-semibold hover:text-primary leading-tight block"
              >
                {item.title}
              </Link>
              {item.subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" />
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
          {showVs && idx === 0 && (
            <div className="shrink-0 flex items-center justify-center" style={{ alignSelf: "flex-start", marginTop: "calc(min(220px, 25vw) * 0.75 / 2 - 20px)" }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md">
                VS
              </span>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex gap-4 mt-6 mb-1">
      <div className={LABEL_COL} />
      <div className="flex-1">
        <div className="text-center font-bold text-sm uppercase tracking-wider text-foreground bg-muted/60 rounded-lg py-2 px-4">
          {label}
        </div>
      </div>
    </div>
  );
}

function DataRow({
  label,
  count,
  index,
  children,
}: {
  label: string;
  count: number;
  index: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  const zebra = index % 2 === 1 ? "bg-muted/20" : "bg-transparent";
  return (
    <div className={`flex gap-4 py-3 border-b border-border/30 rounded-md ${zebra}`}>
      <div className={`${LABEL_COL} text-sm text-muted-foreground self-center pl-2`}>{label}</div>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <div key={i} className="flex-1 min-w-[220px] text-sm text-center self-center">
              {c}
            </div>
          ))
        : <div className="flex-1 min-w-[220px] text-sm text-center self-center">{children}</div>}
    </div>
  );
}

function CellText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-foreground font-medium ${className}`}>{children}</span>;
}

function PriceStrong({ value }: { value: string }) {
  return <span className="font-bold text-primary text-base">{value}</span>;
}

function Dash() {
  return <span className="text-muted-foreground/50">—</span>;
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <span
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-700"
      aria-label="Oui"
    >
      <Check className="h-4 w-4" />
    </span>
  ) : (
    <span
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground/50"
      aria-label="Non"
    >
      <X className="h-4 w-4" />
    </span>
  );
}
