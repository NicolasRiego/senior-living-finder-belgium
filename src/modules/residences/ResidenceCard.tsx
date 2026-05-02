import { Link } from "react-router-dom";
import { MapPin, Users, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import type { Residence } from "@/modules/residences/data";

export function ResidenceCard({ residence }: { residence: Residence }) {
  const { t } = useI18n();
  const { has, toggle, isFull } = useCompare();
  const inCompare = has(residence.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link to={`/residences/${residence.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={residence.image}
          alt={residence.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1.5 text-sm font-medium text-foreground shadow-soft">
          {t(`residenceTypes.${residence.type}`)}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-foreground/85 px-3 py-1.5 text-sm font-medium text-background">
          <Star className="h-3.5 w-3.5" fill="currentColor" /> {residence.rating.toFixed(1)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold leading-tight">
          <Link to={`/residences/${residence.slug}`} className="hover:text-primary">
            {residence.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-base text-muted-foreground">
          <MapPin className="h-4 w-4" /> {residence.city} · {residence.region}
        </div>
        <p className="mt-3 line-clamp-2 text-base text-muted-foreground">{residence.shortDescription}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {residence.services.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {residence.capacity} {t("detail.units")}
            </div>
            <div className="mt-1">
              <span className="text-sm text-muted-foreground">{t("common.from")} </span>
              <span className="font-display text-2xl font-semibold text-primary">
                {residence.priceFrom.toLocaleString("fr-BE")}€
              </span>
              <span className="text-sm text-muted-foreground">{t("common.perMonth")}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link to={`/residences/${residence.slug}`}>{t("common.learnMore")}</Link>
          </Button>
          <Button
            type="button"
            variant={inCompare ? "soft" : "outline"}
            size="sm"
            disabled={!inCompare && isFull}
            onClick={() => toggle(residence.id)}
            aria-pressed={inCompare}
          >
            {inCompare ? <Check className="h-4 w-4" /> : null}
            <span className="hidden sm:inline">
              {inCompare ? t("common.removeFromCompare") : t("common.compare")}
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}
