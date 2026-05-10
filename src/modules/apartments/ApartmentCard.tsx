import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Building2, Maximize, Layers, GitCompare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useFavorites } from "@/modules/favorites/useFavorites";
import { useCompare } from "@/modules/compare/CompareProvider";
import { getCoverUrl } from "./publicApi";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import type { ApartmentSearchRow } from "./types";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label])
);

export function ApartmentCard({ row }: { row: ApartmentSearchRow }) {
  const { tr } = useI18n();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const { has, toggle } = useFavorites();
  const { hasApt, toggleApt, isAptFull } = useCompare();
  const isFav = has(row.residence_id);
  const inCompare = hasApt(row.id);
  const name = tr(row.residence_nom_fr, row.residence_nom_nl);

  useEffect(() => {
    let active = true;
    if (row.cover_path) {
      getCoverUrl(row.cover_path).then((u) => { if (active) setCoverUrl(u); });
    }
    return () => { active = false; };
  }, [row.cover_path]);

  const showSale = row.transaction_type === "sale" || row.transaction_type === "both";
  const showRent = row.transaction_type === "rent" || row.transaction_type === "both";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link to={`/appartements/${row.id}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Building2 className="h-8 w-8" />
          </div>
        )}
        {row.type && (
          <span className="badge-fixed absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-background/95 px-3 py-1.5 font-medium text-foreground shadow-soft">
            {TYPE_LABEL[row.type] ?? row.type}
          </span>
        )}
        {showSale && (
          <span className="badge-fixed absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 font-medium text-success-foreground shadow-soft">
            À vendre
          </span>
        )}
        {showRent && (
          <span
            className={
              "badge-fixed absolute right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground shadow-soft " +
              (showSale ? "top-14" : "top-4")
            }
          >
            À louer
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl font-semibold leading-tight break-words">
          <Link to={`/appartements/${row.id}`} className="hover:text-primary">{name}</Link>
        </h3>
        {(row.ville || row.region) && (
          <div className="flex items-center gap-1.5 text-base text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="break-words">{[row.code_postal, row.ville, row.region].filter(Boolean).join(" · ")}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-base text-muted-foreground">
          {row.surface_m2 != null && (
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="h-4 w-4" /> {row.surface_m2} m²
            </span>
          )}
          {row.floor != null && (
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> {row.floor === 0 ? "Rez-de-chaussée" : `Étage ${row.floor}`}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <div className="space-y-1">
            {showSale && row.sale_price != null && row.sale_price > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Prix : </span>
                <span className="font-display text-xl font-semibold text-primary xl:text-2xl">
                  {row.sale_price.toLocaleString("fr-BE")} €
                </span>
              </div>
            )}
            {showRent && row.rent_price != null && row.rent_price > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Loyer : </span>
                <span className="font-display text-xl font-semibold text-primary xl:text-2xl">
                  {row.rent_price.toLocaleString("fr-BE")} €
                </span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
            )}
            {(!showSale || !row.sale_price || row.sale_price <= 0) &&
              (!showRent || !row.rent_price || row.rent_price <= 0) && (
                <span className="text-sm text-muted-foreground">Prix sur demande</span>
              )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="w-auto whitespace-nowrap px-4">
              <Link to={`/appartements/${row.id}`}>Voir l'appartement</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isFav ? "soft" : "outline"}
              onClick={() => toggle(row.residence_id)}
              aria-pressed={isFav}
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              className="px-3"
            >
              <Heart className={"h-4 w-4 " + (isFav ? "fill-current" : "")} />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleApt(row.id);
              }}
              disabled={!inCompare && isAptFull}
              aria-label={inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
              title={
                inCompare
                  ? "Retirer du comparateur"
                  : isAptFull
                  ? "Comparateur plein (max 4)"
                  : "Ajouter au comparateur"
              }
              className={"px-3 " + (inCompare ? "border-primary text-primary" : "")}
            >
              {inCompare ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
            </Button>
            <Button asChild size="sm" variant="outline" className="w-auto whitespace-nowrap px-4">
              <Link to={`/residences/${row.residence_slug}`}>Voir la résidence</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
