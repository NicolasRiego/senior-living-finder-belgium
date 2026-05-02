import { useMemo, useState } from "react";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { residences } from "@/modules/residences/data";
import { ResidenceCard } from "@/modules/residences/ResidenceCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Region, ResidenceType } from "@/modules/residences/types";

const REGIONS: ("all" | Region)[] = ["all", "Bruxelles", "Wallonie", "Flandre"];
const TYPES: ("all" | ResidenceType)[] = ["all", "services", "seigneurie", "repos", "repos_soins"];

export default function ResidencesPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("all");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [sort, setSort] = useState<"reco" | "asc" | "desc">("reco");

  const filtered = useMemo(() => {
    let list = residences.filter((r) => {
      if (region !== "all" && r.region !== region) return false;
      if (type !== "all" && r.type !== type) return false;
      if (r.priceFrom > maxPrice) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        if (!r.name.toLowerCase().includes(needle) && !r.city.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
    if (sort === "asc") list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "desc") list = [...list].sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "reco") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, region, type, maxPrice, sort]);

  return (
    <div className="container py-12 lg:py-16">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("residences.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("residences.subtitle", { count: filtered.length })}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:sticky lg:top-28 lg:h-fit">
          <h2 className="mb-5 font-display text-xl font-semibold">{t("residences.filters")}</h2>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("common.search")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ville, nom…" className="pl-10 h-12 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("residences.region")}</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition " +
                      (region === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40")
                    }
                  >
                    {r === "all" ? t("residences.allRegions") : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("common.type")}</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setType(tp)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition " +
                      (type === tp
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40")
                    }
                  >
                    {tp === "all" ? t("residences.typeAll") : t(`residenceTypes.${tp}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("residences.priceRange")} : <span className="font-semibold text-primary">≤ {maxPrice}€</span>
              </label>
              <input
                type="range"
                min={1200}
                max={3000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>

            <div>
              <label htmlFor="sort" className="mb-2 block text-sm font-medium">{t("residences.sortBy")}</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="reco">{t("residences.sortRecommended")}</option>
                <option value="asc">{t("residences.sortPriceAsc")}</option>
                <option value="desc">{t("residences.sortPriceDesc")}</option>
              </select>
            </div>
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center text-lg text-muted-foreground">
              {t("residences.noResults")}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <ResidenceCard key={r.id} residence={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
