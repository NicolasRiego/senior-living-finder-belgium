import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, BadgeCheck, Accessibility, CheckCircle2, ChevronLeft, ChevronRight, GitCompare, Check, Heart } from "lucide-react";
import { useCompare } from "@/modules/compare/CompareProvider";
import { useFavorites } from "@/modules/favorites/useFavorites";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RangeSlider } from "@/components/ui/range-slider";
import { useI18n } from "@/modules/i18n/I18nProvider";
import {
  searchResidences,
  getDistinctFacets,
  getServicesCatalog,
  getCoverUrl,
  type SearchFilters,
  type SearchRow,
} from "@/modules/residences/publicApi";

const PAGE_SIZES = [12, 24];
const TYPES = ["services", "seigneurie", "repos", "repos_soins"];

function paramOr<T extends string>(sp: URLSearchParams, k: string, fallback?: T): T | undefined {
  const v = sp.get(k);
  return (v ?? fallback) as T | undefined;
}

export default function ResidencesPage() {
  const { t, tr } = useI18n();
  const [sp, setSp] = useSearchParams();

  const BUDGET_MIN = 0;
  const BUDGET_MAX = 4000;
  const [budgetRange, setBudgetRange] = useState<[number, number]>([BUDGET_MIN, BUDGET_MAX]);

  const filters: SearchFilters = useMemo(() => ({
    q: sp.get("q") ?? "",
    region: sp.get("region") || undefined,
    province: sp.get("province") || undefined,
    ville: sp.get("ville") || undefined,
    type_etablissement: sp.get("type") || undefined,
    budget_min: budgetRange[0] > BUDGET_MIN ? budgetRange[0] : undefined,
    budget_max: budgetRange[1] < BUDGET_MAX ? budgetRange[1] : undefined,
    services: sp.get("services") ? sp.get("services")!.split(",").filter(Boolean) : [],
    pmr: sp.get("pmr") === "1",
    complete: sp.get("complete") === "1",
    available: sp.get("avail") === "1",
    sort: (paramOr<"relevance" | "price_asc" | "price_desc">(sp, "sort", "relevance")) ?? "relevance",
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    pageSize: sp.get("size") ? Number(sp.get("size")) : 12,
  }), [sp, budgetRange]);

  const updateParam = (patch: Record<string, string | number | boolean | string[] | null | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "" || v === false || (Array.isArray(v) && v.length === 0)) {
        next.delete(k);
      } else if (Array.isArray(v)) {
        next.set(k, v.join(","));
      } else if (typeof v === "boolean") {
        next.set(k, v ? "1" : "0");
      } else {
        next.set(k, String(v));
      }
    }
    if (!("page" in patch)) next.delete("page");
    setSp(next, { replace: true });
  };

  const facets = useQuery({ queryKey: ["facets"], queryFn: getDistinctFacets });
  const servicesCatalog = useQuery({ queryKey: ["services-catalog"], queryFn: getServicesCatalog });

  const search = useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchResidences(filters),
  });

  const total = search.data?.total ?? 0;
  const totalPages = search.data?.totalPages ?? 1;
  const page = filters.page ?? 1;

  return (
    <div className="container py-12 lg:py-16">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("residences.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {search.isLoading ? "…" : t("residences.subtitle", { count: total })}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Filters */}
        <aside className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:sticky lg:top-28 lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 className="mb-5 font-display text-xl font-semibold">{t("residences.filters")}</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("common.search")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  defaultValue={filters.q ?? ""}
                  onChange={(e) => updateParam({ q: e.target.value })}
                  placeholder="Nom, ville…"
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("residences.region")}</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.region ?? ""}
                onChange={(e) => updateParam({ region: e.target.value || null })}
              >
                <option value="">{t("residences.allRegions")}</option>
                {(facets.data?.regions ?? []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Province</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.province ?? ""}
                onChange={(e) => updateParam({ province: e.target.value || null })}
              >
                <option value="">Toutes les provinces</option>
                {(facets.data?.provinces ?? []).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Ville</label>
              <Input
                defaultValue={filters.ville ?? ""}
                onChange={(e) => updateParam({ ville: e.target.value || null })}
                placeholder="Bruxelles, Liège…"
                className="h-10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("common.type")}</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.type_etablissement ?? ""}
                onChange={(e) => updateParam({ type: e.target.value || null })}
              >
                <option value="">{t("residences.typeAll")}</option>
                {TYPES.map((tp) => (
                  <option key={tp} value={tp}>{t(`residenceTypes.${tp}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <RangeSlider
                label="Budget mensuel"
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={50}
                value={budgetRange}
                onValueChange={setBudgetRange}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!filters.pmr}
                  onCheckedChange={(v) => updateParam({ pmr: !!v })}
                />
                <Accessibility className="h-4 w-4" /> Accessibilité PMR
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!filters.complete}
                  onCheckedChange={(v) => updateParam({ complete: !!v })}
                />
                <BadgeCheck className="h-4 w-4" /> Profil complet
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!filters.available}
                  onCheckedChange={(v) => updateParam({ avail: !!v })}
                />
                <CheckCircle2 className="h-4 w-4" /> Disponibilité
              </label>
            </div>

            {(servicesCatalog.data?.length ?? 0) > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium">Services inclus</label>
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border/60 p-2">
                  {(servicesCatalog.data ?? []).map((s: any) => {
                    const checked = (filters.services ?? []).includes(s.code);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const current = filters.services ?? [];
                            const next = v
                              ? Array.from(new Set([...current, s.code]))
                              : current.filter((c) => c !== s.code);
                            updateParam({ services: next });
                          }}
                        />
                        {tr(s.label_fr, s.label_nl)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { setSp(new URLSearchParams(), { replace: true }); setBudgetRange([BUDGET_MIN, BUDGET_MAX]); }}
            >
              Réinitialiser
            </Button>
          </div>
        </aside>

        <div>
          {/* Sort + page size */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground">{t("residences.sortBy")}</label>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={filters.sort}
                onChange={(e) => updateParam({ sort: e.target.value })}
              >
                <option value="relevance">{t("residences.sortRecommended")}</option>
                <option value="price_asc">{t("residences.sortPriceAsc")}</option>
                <option value="price_desc">{t("residences.sortPriceDesc")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Par page</span>
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateParam({ size: s })}
                  className={
                    "rounded-md border px-2.5 py-1 text-sm font-medium transition " +
                    (filters.pageSize === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {search.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: filters.pageSize ?? 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[420px] rounded-2xl" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center text-lg text-muted-foreground">
              {t("residences.noResults")}
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {(search.data?.rows ?? []).map((r) => (
                  <PublicResidenceCard key={r.id} row={r} />
                ))}
              </div>

              {/* Pagination */}
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
    </div>
  );
}

function PublicResidenceCard({ row }: { row: SearchRow }) {
  const { t, tr } = useI18n();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const { has, toggle, isFull } = useCompare();
  const { has: isFav, toggle: toggleFav } = useFavorites();
  const inCompare = has(row.id);
  const saved = isFav(row.id);
  const name = tr(row.nom_fr, row.nom_nl);
  const tagline = tr(row.tagline_fr, row.tagline_nl);

  useEffect(() => {
    let active = true;
    const FALLBACK =
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80";
    if (row.cover_path) {
      getCoverUrl(row.cover_path).then((u) => {
        if (active) setCoverUrl(u ?? FALLBACK);
      });
    } else {
      if (active) setCoverUrl(FALLBACK);
    }
    return () => { active = false; };
  }, [row.cover_path]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <div className="relative">
        <Link to={`/residences/${row.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200";
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          )}
          <span className="badge-fixed absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 font-medium text-foreground shadow-soft">
            {t(`residenceTypes.${row.type_etablissement}`)}
          </span>
          {row.is_complete && (
            <span className="badge-fixed absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1.5 font-medium text-primary-foreground shadow-soft">
              <BadgeCheck className="h-3.5 w-3.5" /> Profil complet
            </span>
          )}
        </Link>
      </div>



      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl font-semibold leading-tight break-words">
          <Link to={`/residences/${row.slug}`} className="hover:text-primary">{name}</Link>
        </h3>
        {(row.ville || row.region) && (
          <div className="flex items-center gap-1.5 text-base text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" /> <span className="break-words">{[row.ville, row.region].filter(Boolean).join(" · ")}</span>
          </div>
        )}
        {tagline && (
          <p className="line-clamp-2 text-base text-muted-foreground">{tagline}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {row.is_pmr && (
            <span className="badge-fixed inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
              <Accessibility className="h-3 w-3" /> PMR
            </span>
          )}
          {row.has_availability && (
            <span className="badge-fixed inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent-foreground">
              <CheckCircle2 className="h-3 w-3" /> Disponible
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <div>
            {row.price_from != null ? (
              <div>
                <span className="text-sm text-muted-foreground">{t("common.from")} </span>
                <span className="font-display text-2xl font-semibold text-primary">
                  {Number(row.price_from).toLocaleString("fr-BE")}€
                </span>
                <span className="text-sm text-muted-foreground">{t("common.perMonth")}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Tarifs sur demande</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-nowrap items-center gap-2">
              <Button asChild size="sm" className="flex-1 min-w-0 whitespace-nowrap px-4">
                <Link to={`/residences/${row.slug}`}>{t("common.learnMore")}</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={saved ? "soft" : "outline"}
                onClick={() => toggleFav(row.id)}
                aria-pressed={saved}
                aria-label={saved ? "Retirer de mes résidences" : "Enregistrer cette résidence"}
                className="shrink-0 px-3"
              >
                <Heart className={"h-4 w-4 " + (saved ? "fill-current text-success" : "")} />
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant={inCompare ? "soft" : "outline"}
              disabled={!inCompare && isFull}
              onClick={() => toggle(row.id)}
              aria-pressed={inCompare}
              title={inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
              className="w-full px-4"
            >
              {inCompare ? (
                <>
                  <Check className="h-4 w-4" /> Dans le comparateur
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" /> Comparateur
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
