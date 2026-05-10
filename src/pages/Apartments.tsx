import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Home, MapPin, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { listApartmentResidences, searchApartments } from "@/modules/apartments/publicApi";
import { usePostalSearch } from "@/modules/apartments/usePostalSearch";
import {
  APT_BOOL_FIELDS,
  APT_BOOL_LABELS,
  type ApartmentFilters,
  type ApartmentSort,
  type ApartmentType,
  type TxFilter,
} from "@/modules/apartments/types";
import { ApartmentCard } from "@/modules/apartments/ApartmentCard";
import { ResidencePickerDialog } from "@/modules/apartments/ResidencePickerDialog";

const APT_TYPES: ApartmentType[] = ["appartement", "chambre", "studio"];
const TX_OPTIONS: { value: TxFilter; label: string; urlValue: string | null }[] = [
  { value: "sale", label: "À vendre", urlValue: "vente" },
  { value: "rent", label: "À louer", urlValue: "location" },
  { value: "all", label: "Tout", urlValue: null },
];

function urlToTx(v: string | null): TxFilter {
  if (v === "vente") return "sale";
  if (v === "location") return "rent";
  return "all";
}

export default function ApartmentsPage() {
  const [sp, setSp] = useSearchParams();

  const filters: ApartmentFilters = useMemo(() => {
    const tx = urlToTx(sp.get("type"));
    const residencesParam = sp.get("residences");
    const sortParam = sp.get("sort") as ApartmentSort | null;
    const validSorts: ApartmentSort[] = ["price_asc", "price_desc", "surface_asc", "surface_desc"];
    const f: ApartmentFilters = {
      tx,
      country: (sp.get("pays") as "BE" | "FR") || "BE",
      code_postal: sp.get("cp") || undefined,
      type: (sp.get("aptType") as ApartmentType) || undefined,
      surface_min: sp.get("surface") ? Number(sp.get("surface")) : undefined,
      sale_max: sp.get("saleMax") ? Number(sp.get("saleMax")) : undefined,
      rent_max: sp.get("rentMax") ? Number(sp.get("rentMax")) : undefined,
      residence_ids: residencesParam ? residencesParam.split(",").filter(Boolean) : undefined,
      sort: sortParam && validSorts.includes(sortParam) ? sortParam : "price_asc",
      page: sp.get("page") ? Number(sp.get("page")) : 1,
      pageSize: 12,
    };
    for (const k of APT_BOOL_FIELDS) {
      if (sp.get(k) === "1") (f as Record<string, unknown>)[k] = true;
    }
    return f;
  }, [sp]);

  const updateParam = (patch: Record<string, string | number | boolean | null | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "" || v === false) next.delete(k);
      else if (typeof v === "boolean") next.set(k, "1");
      else next.set(k, String(v));
    }
    if (!("page" in patch)) next.delete("page");
    setSp(next, { replace: true });
  };

  const setTx = (tx: TxFilter) => {
    const opt = TX_OPTIONS.find((o) => o.value === tx)!;
    updateParam({ type: opt.urlValue, saleMax: null, rentMax: null, sort: "price_asc" });
  };

  const setSort = (s: ApartmentSort) => updateParam({ sort: s });

  const setResidenceIds = (ids: string[]) =>
    updateParam({ residences: ids.length ? ids.join(",") : null });

  const search = useQuery({
    queryKey: ["apartments-search", filters],
    queryFn: () => searchApartments(filters),
  });

  const residencesFacet = useQuery({
    queryKey: ["apartments-residences-facet"],
    queryFn: listApartmentResidences,
    staleTime: 5 * 60 * 1000,
  });

  const selectedIds = filters.residence_ids ?? [];
  const selectedResidences = useMemo(() => {
    const list = residencesFacet.data ?? [];
    return selectedIds
      .map((id) => list.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => !!r);
  }, [residencesFacet.data, selectedIds]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [postalQuery, setPostalQuery] = useState(
    filters.code_postal ? filters.code_postal : ""
  );
  const [postalOpen, setPostalOpen] = useState(false);
  const { results: postalResults } = usePostalSearch(postalQuery);

  const total = search.data?.total ?? 0;
  const totalPages = search.data?.totalPages ?? 1;
  const page = filters.page ?? 1;
  const showSaleSlider = filters.tx === "sale" || filters.tx === "all";
  const showRentSlider = filters.tx === "rent" || filters.tx === "all";
  const isSaleMode = filters.tx === "sale";
  const sortOptions: { value: ApartmentSort; label: string }[] = [
    { value: "price_asc", label: isSaleMode ? "Prix croissant (achat)" : "Prix croissant (loyer)" },
    { value: "price_desc", label: isSaleMode ? "Prix décroissant (achat)" : "Prix décroissant (loyer)" },
    { value: "surface_desc", label: "Surface : grande → petite" },
    { value: "surface_asc", label: "Surface : petite → grande" },
  ];

  return (
    <div className="container py-12 lg:py-16">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">
          Appartements seniors
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {search.isLoading ? "…" : `${total} logement${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft lg:sticky lg:top-28 lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 className="mb-5 font-display text-xl font-semibold">Filtres</h2>

          <div className="space-y-5">
            {/* Transaction toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium">Transaction</label>
              <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1 tx-toggle">
                {TX_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setTx(o.value)}
                    className={
                      "flex-1 min-w-[80px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition " +
                      (filters.tx === o.value
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-foreground/80 hover:bg-muted")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {showSaleSlider && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Prix d'achat max : <span className="font-semibold text-primary">{(filters.sale_max ?? 800000).toLocaleString("fr-BE")} €</span>
                </label>
                <input
                  type="range"
                  min={50000}
                  max={800000}
                  step={5000}
                  value={filters.sale_max ?? 800000}
                  onChange={(e) => updateParam({ saleMax: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
            )}

            {showRentSlider && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Loyer mensuel max : <span className="font-semibold text-primary">{(filters.rent_max ?? 5000).toLocaleString("fr-BE")} €</span>
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={50}
                  value={filters.rent_max ?? 5000}
                  onChange={(e) => updateParam({ rentMax: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">Pays</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.country}
                onChange={(e) => updateParam({ pays: e.target.value })}
              >
                <option value="BE">Belgique</option>
                <option value="FR" disabled>France (disponible bientôt)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Code postal ou commune</label>
              <div className="relative">
                <Input
                  value={postalQuery}
                  onChange={(e) => {
                    setPostalQuery(e.target.value);
                    setPostalOpen(true);
                    if (!e.target.value) {
                      updateParam({ cp: null });
                    }
                  }}
                  onFocus={() => postalQuery && setPostalOpen(true)}
                  onBlur={() => setTimeout(() => setPostalOpen(false), 200)}
                  placeholder="ex: 1180 ou Uccle…"
                  className="h-11 pr-9"
                  autoComplete="off"
                />
                {postalQuery && (
                  <button
                    type="button"
                    aria-label="Effacer"
                    onClick={() => {
                      setPostalQuery("");
                      setPostalOpen(false);
                      updateParam({ cp: null });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {postalOpen && postalResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                    {postalResults.map((r) => (
                      <button
                        type="button"
                        key={r.code_postal + r.commune_fr}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setPostalQuery(r.code_postal);
                          setPostalOpen(false);
                          updateParam({ cp: r.code_postal });
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-0 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-bold text-foreground text-sm shrink-0 w-12">
                            {r.code_postal}
                          </span>
                          <span className="text-sm text-foreground truncate">
                            {r.commune_fr}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 bg-muted rounded-full px-2 py-0.5">
                          {r.province}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filters.code_postal && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Filtre actif : <span className="font-medium text-foreground">{postalQuery}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Résidence</label>
              {selectedIds.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-input bg-background text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4 shrink-0" />
                  <span>Choisir des résidences</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResidences.slice(0, 2).map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-foreground"
                      >
                        <span className="max-w-[120px] truncate">{r.nom_fr}</span>
                        <button
                          type="button"
                          aria-label={`Retirer ${r.nom_fr}`}
                          onClick={() =>
                            setResidenceIds(selectedIds.filter((id) => id !== r.id))
                          }
                          className="rounded-full p-0.5 hover:bg-primary/20 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedIds.length > 2 && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        +{selectedIds.length - 2}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier la sélection ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Type de bien</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.type ?? ""}
                onChange={(e) => updateParam({ aptType: e.target.value || null })}
              >
                <option value="">Tous</option>
                {APT_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp.charAt(0).toUpperCase() + tp.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Surface minimum (m²)</label>
              <Input
                type="number"
                min={0}
                defaultValue={filters.surface_min ?? ""}
                onChange={(e) => updateParam({ surface: e.target.value ? Number(e.target.value) : null })}
                placeholder="ex. 30"
                className="h-10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Équipements</label>
              <div className="space-y-2">
                {APT_BOOL_FIELDS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!filters[f]}
                      onCheckedChange={(v) => updateParam({ [f]: !!v })}
                    />
                    {APT_BOOL_LABELS[f]}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSp(new URLSearchParams(), { replace: true })}
            >
              Réinitialiser
            </Button>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft">
            <span className="text-sm text-muted-foreground">
              {search.isLoading ? "Chargement…" : `${total} résultat${total > 1 ? "s" : ""}`}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="apt-sort" className="text-sm font-medium">Trier par</label>
              <select
                id="apt-sort"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.sort ?? "price_asc"}
                onChange={(e) => setSort(e.target.value as ApartmentSort)}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {search.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[420px] rounded-2xl" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center text-lg text-muted-foreground">
              Aucun appartement ne correspond à vos critères.
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {(search.data?.rows ?? []).map((row) => (
                  <ApartmentCard key={row.id} row={row} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateParam({ page: page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" /> Précédent
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateParam({ page: page + 1 })}
                  >
                    Suivant <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ResidencePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        appliedIds={selectedIds}
        onApply={(ids) => setResidenceIds(ids)}
      />
    </div>
  );
}
