import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Building2, Maximize, Layers, GitCompare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useSavedApartments } from "@/modules/apartments/savedApartments";
import { useCompare, COMPARE_FULL_TIP_APT_L1, COMPARE_FULL_TIP_APT_L2 } from "@/modules/compare/CompareProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCoverUrl } from "./publicApi";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import type { ApartmentSearchRow } from "./types";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label])
);

export function ApartmentCard({ row }: { row: ApartmentSearchRow }) {
  const { tr } = useI18n();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const { has: hasSaved, add: addSaved, remove: removeSaved } = useSavedApartments();
  const { hasApt, toggleApt, isAptFull } = useCompare();
  const isSaved = hasSaved(row.id);
  const inCompare = hasApt(row.id);
  const name = tr(row.residence_nom_fr, row.residence_nom_nl);

  useEffect(() => {
    let active = true;
    const FALLBACKS: Record<string, string> = {
      studio: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      chambre: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
      appartement: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      duplex: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      penthouse: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      loft: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
      villa: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    };
    const fb = (row.type && FALLBACKS[row.type]) ?? FALLBACKS.appartement;
    if (row.cover_path) {
      getCoverUrl(row.cover_path).then((u) => {
        if (active) setCoverUrl(u ?? fb);
      });
    } else {
      if (active) setCoverUrl(fb);
    }
    return () => { active = false; };
  }, [row.cover_path, row.type]);

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
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              const fallbacks: Record<string, string> = {
                studio: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800",
                chambre: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800",
                appartement: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800",
                duplex: "https://images.pexels.com/photos/2029731/pexels-photo-2029731.jpeg?auto=compress&cs=tinysrgb&w=800",
                penthouse: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
              };
              target.src = fallbacks[row.type] ?? "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800";
            }}
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
          <div className="space-y-2">
            {showSale && row.sale_price != null && row.sale_price > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">À partir de</div>
                <div>
                  <span className="font-display text-2xl font-semibold text-primary">
                    {row.sale_price.toLocaleString("fr-BE")} €
                  </span>
                </div>
              </div>
            )}
            {showRent && row.rent_price != null && row.rent_price > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">Loyer mensuel — à partir de</div>
                <div>
                  <span className="font-display text-2xl font-semibold text-primary">
                    {row.rent_price.toLocaleString("fr-BE")} €
                  </span>
                  <span className="text-sm text-muted-foreground">/mois</span>
                </div>
              </div>
            )}
            {(!showSale || !row.sale_price || row.sale_price <= 0) &&
              (!showRent || !row.rent_price || row.rent_price <= 0) && (
                <span className="text-sm text-muted-foreground">Prix sur demande</span>
              )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="flex-1 min-w-[140px] whitespace-nowrap">
              <Link to={`/appartements/${row.id}`}>Voir le logement</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isSaved ? "soft" : "outline"}
              onClick={() => {
                if (isSaved) {
                  removeSaved(row.id);
                } else {
                  addSaved({
                    id: row.id,
                    residence_id: row.residence_id,
                    residence_slug: row.residence_slug,
                    residence_nom_fr: row.residence_nom_fr,
                    type: row.type,
                    surface_m2: row.surface_m2,
                    sale_price: row.sale_price,
                    rent_price: row.rent_price,
                    transaction_type: row.transaction_type,
                    cover_path: row.cover_path,
                    ville: row.ville,
                  });
                }
              }}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Retirer de mes logements" : "Enregistrer ce logement"}
              className="px-3"
            >
              <Heart className={"h-4 w-4 " + (isSaved ? "fill-current text-success" : "")} />
            </Button>
          </div>

          {(() => {
            const disabled = !inCompare && isAptFull;
            const btn = (
              <Button
                type="button"
                size="sm"
                variant={inCompare ? "soft" : "outline"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleApt(row.id);
                }}
                disabled={disabled}
                aria-pressed={inCompare}
                aria-label={inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
                className="w-full whitespace-nowrap"
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
            );
            if (!disabled) return btn;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block w-full">{btn}</span>
                </TooltipTrigger>
                <TooltipContent>{COMPARE_FULL_TIP_APT}</TooltipContent>
              </Tooltip>
            );
          })()}

          <Button asChild size="sm" variant="ghost" className="w-full whitespace-nowrap">
            <Link to={`/residences/${row.residence_slug}`}>Voir la résidence</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
