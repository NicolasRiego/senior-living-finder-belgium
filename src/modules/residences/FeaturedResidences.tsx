import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { searchResidences, getCoverUrl, type SearchRow } from "@/modules/residences/publicApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/modules/favorites/useFavorites";

function truncate(s: string | null | undefined, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}


function FeaturedCard({ row }: { row: SearchRow }) {
  const { t } = useI18n();
  const [cover, setCover] = useState<string | null>(null);
  const { has: hasFav, toggle: toggleFav } = useFavorites();
  const saved = hasFav(row.id);


  useEffect(() => {
    let cancelled = false;
    getCoverUrl(row.cover_path).then((u) => {
      if (!cancelled) setCover(u);
    });
    return () => {
      cancelled = true;
    };
  }, [row.cover_path]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link to={`/residences/${row.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={row.nom_fr}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
        <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-foreground shadow-soft">
          {t(`residenceTypes.${row.type_etablissement}`)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold leading-tight break-words">
          <Link to={`/residences/${row.slug}`} className="hover:text-primary">
            {row.nom_fr}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-base text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-words">
            {row.ville}
            {row.region ? ` · ${row.region}` : ""}
          </span>
        </div>
        {row.tagline_fr ? (
          <p className="mt-3 min-h-[3em] text-base text-muted-foreground">{truncate(row.tagline_fr, 80)}</p>
        ) : (
          <p className="mt-3 min-h-[3em]" />
        )}

        {row.price_from != null && (
          <div className="mt-auto pt-6">
            <span className="text-sm text-muted-foreground">{t("common.from")} </span>
            <span className="font-display text-2xl font-semibold text-primary">
              {Number(row.price_from).toLocaleString("fr-BE")}€
            </span>
            <span className="text-sm text-muted-foreground">{t("common.perMonth")}</span>
          </div>
        )}

        <div className={"flex gap-2 " + (row.price_from != null ? "mt-4" : "mt-auto pt-6")}>
          <Button asChild size="sm" className="flex-1">
            <Link to={`/residences/${row.slug}`}>{t("common.learnMore")}</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={saved ? "soft" : "outline"}
            onClick={() => toggleFav(row.id)}
            aria-pressed={saved}
            aria-label={saved ? "Retirer de mes résidences" : "Enregistrer cette résidence"}
            className="px-3"
          >
            <Heart className={"h-4 w-4 " + (saved ? "fill-current text-success" : "")} />
          </Button>
        </div>
      </div>
    </article>
  );
}


export function FeaturedResidences() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-residences"],
    queryFn: () => searchResidences({ sort: "relevance", page: 1, pageSize: 6 }),
  });

  if (isLoading) {
    return (
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const rows = data?.rows ?? [];
  if (!rows.length) return null;

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <FeaturedCard key={r.id} row={r} />
      ))}
    </div>
  );
}
