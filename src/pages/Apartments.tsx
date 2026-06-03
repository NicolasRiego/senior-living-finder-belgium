import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, Home, MapPin, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RangeSlider } from "@/components/ui/range-slider";
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
import { useAuth } from "@/modules/auth/AuthProvider";
import { useSavedApartments } from "@/modules/apartments/savedApartments";
import { openLoginGate } from "@/modules/auth/loginGate";


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
  const { user } = useAuth();
  const { items: savedItems } = useSavedApartments();
  const savedIds = useMemo(() => new Set(savedItems.map((s) => s.id)), [savedItems]);
  const [savedOnly, setSavedOnly] = useState(false);

  const SALE_MIN = 0;
  const SALE_MAX = 800000;
  const RENT_MIN = 0;
  const RENT_MAX = 5000;
  const [saleRange, setSaleRange] = useState<[number, number]>([SALE_MIN, SALE_MAX]);
  const [rentRange, setRentRange] = useState<[number, number]>([RENT_MIN, RENT_MAX]);


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
      sale_min: saleRange[0] > SALE_MIN ? saleRange[0] : undefined,
      sale_max: saleRange[1] < SALE_MAX ? saleRange[1] : undefined,
      rent_min: rentRange[0] > RENT_MIN ? rentRange[0] : undefined,
      rent_max: rentRange[1] < RENT_MAX ? rentRange[1] : undefined,
      residence_ids: residencesParam ? residencesParam.split(",").filter(Boolean) : undefined,
      sort: sortParam && validSorts.includes(sortParam) ? sortParam : "price_asc",
      page: sp.get("page") ? Number(sp.get("page")) : 1,
      pageSize: 12,
    };
    for (const k of APT_BOOL_FIELDS) {
      if (sp.get(k) === "1") (f as Record<string, unknown>)[k] = true;
    }
    return f;
  }, [sp, saleRange, rentRange]);

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
    setSaleRange([SALE_MIN, SALE_MAX]);
    setRentRange([RENT_MIN, RENT_MAX]);
    updateParam({ type: opt.urlValue, sort: "price_asc" });
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
  const [selectedPostals, setSelectedPostals] = useState<Array<{ code: string; commune: string }>>(
    () => {
      const cp = sp.get("cp");
      if (!cp) return [];
      return cp.split(",").filter(Boolean).map((c) => ({ code: c, commune: "" }));
    },
  );
  const [postalQuery, setPostalQuery] = useState("");
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
          Logements seniors
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
              <RangeSlider
                label="Prix d'achat"
                min={SALE_MIN}
                max={SALE_MAX}
                step={5000}
                value={saleRange}
                onValueChange={setSaleRange}
              />
            )}

            {showRentSlider && (
              <RangeSlider
                label="Loyer mensuel minimum"
                min={RENT_MIN}
                max={RENT_MAX}
                step={50}
                value={rentRange}
                onValueChange={setRentRange}
              />
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Code postal ou commune</label>
              <div className="relative">
                <Input
                  value={postalQuery}
                  onChange={(e) => {
                    setPostalQuery(e.target.value);
                    setPostalOpen(true);
                  }}
                  onFocus={() => setPostalOpen(true)}
                  onBlur={() => setTimeout(() => setPostalOpen(false), 200)}
                  placeholder="ex: 1180 ou Uccle…"
                  className="h-10 text-sm pr-9"
                  autoComplete="off"
                />
                {postalQuery && (
                  <button
                    type="button"
                    aria-label="Effacer"
                    onClick={() => {
                      setPostalQuery("");
                      setPostalOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {postalOpen && postalResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                    {postalResults
                      .filter((r) => !selectedPostals.some((p) => p.code === r.code_postal))
                      .map((r) => (
                        <button
                          type="button"
                          key={r.code_postal + r.commune_fr}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const newPostal = { code: r.code_postal, commune: r.commune_fr };
                            const updated = [...selectedPostals, newPostal];
                            setSelectedPostals(updated);
                            setPostalQuery("");
                            setPostalOpen(false);
                            updateParam({ cp: updated.map((p) => p.code).join(",") });
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-muted transition-colors border-b border-border/20 last:border-0"
                        >
                          <span className="text-[11px] text-foreground leading-none">
                            {r.code_postal}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1.5 leading-none">
                            {r.commune_fr}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {selectedPostals.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {selectedPostals.map((p) => (
                    <div
                      key={p.code}
                      className="flex items-center justify-between gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5"
                    >
                      <span className="text-xs font-medium text-primary truncate">
                        {p.code}
                        {p.commune ? ` · ${p.commune}` : ""}
                      </span>
                      <button
                        type="button"
                        aria-label={`Retirer ${p.code}`}
                        onClick={() => {
                          const updated = selectedPostals.filter((x) => x.code !== p.code);
                          setSelectedPostals(updated);
                          updateParam({
                            cp: updated.length > 0 ? updated.map((x) => x.code).join(",") : null,
                          });
                        }}
                        className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-2 mt-1">
                  {selectedIds.map((id) => {
                    const res = selectedResidences.find((r) => r.id === id);
                    if (!res) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-primary leading-tight flex-1">
                          {res.nom_fr}
                          {res.code_postal && (
                            <span className="text-primary/60 ml-1.5">({res.code_postal})</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setResidenceIds(selectedIds.filter((x) => x !== id))}
                          className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-destructive/20 hover:text-destructive transition-colors"
                          aria-label={`Retirer ${res.nom_fr}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-muted/50 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" />
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
