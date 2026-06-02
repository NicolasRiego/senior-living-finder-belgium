import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Heart, Building2, Check, GitCompare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { getApartmentById } from "@/modules/apartments/publicApi";
import { useSavedApartments } from "@/modules/apartments/savedApartments";
import { useCompare } from "@/modules/compare/CompareProvider";
import { APT_BOOL_FIELDS, APT_BOOL_LABELS } from "@/modules/apartments/types";
import {
  OverviewBadges, GeneralInfo, InteriorInfo, ExteriorInfo,
  InstallationsInfo, EnergyInfo, FinancesInfo,
} from "@/modules/apartments/detail/InfoSections";

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  chambre: "Chambre",
  studio: "Studio",
};

export default function ApartmentDetailPage() {
  const { tr } = useI18n();
  const { id = "" } = useParams();
  const [activePhoto, setActivePhoto] = useState(0);
  const { has: hasSaved, add: addSaved, remove: removeSaved } = useSavedApartments();
  const { hasApt, toggleApt, isAptFull } = useCompare();

  const { data, isLoading } = useQuery({
    queryKey: ["apartment-detail", id],
    queryFn: () => getApartmentById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="container py-24 text-center text-muted-foreground">Chargement…</div>;
  }
  if (!data) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Appartement introuvable</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/appartements"><ArrowLeft /> Retour aux appartements</Link>
        </Button>
      </div>
    );
  }

  const { apartment: a, residence: r, photos, additional_charges: addCharges, custom_equipment: customEq } = data;
  const residenceName = tr(r.nom_fr, r.nom_nl);
  const description = tr(a.description_fr, a.description_nl);
  const typeLabel = a.type ? (TYPE_LABEL[a.type] ?? a.type) : "Logement";
  const aptTitleBase = tr(a.title_fr, a.title_nl);
  const aptTitle = aptTitleBase
    ? aptTitleBase
    : `${typeLabel} ${a.surface_m2 ? `de ${a.surface_m2} m²` : ""} — ${residenceName}`.trim();

  const subtitleParts: string[] = [];
  if (a.surface_m2) subtitleParts.push(`${a.surface_m2} m²`);
  subtitleParts.push(typeLabel);
  if (a.floor != null) subtitleParts.push(a.floor === 0 ? "Rez-de-chaussée" : `Étage ${a.floor}`);

  const isSaved = hasSaved(a.id);
  const onToggleSave = () => {
    if (isSaved) {
      removeSaved(a.id);
    } else {
      addSaved({
        id: a.id,
        residence_id: a.residence_id,
        residence_slug: r.slug,
        residence_nom_fr: r.nom_fr,
        type: a.type,
        surface_m2: a.surface_m2,
        sale_price: a.sale_price,
        rent_price: a.rent_price,
        transaction_type: a.transaction_type,
        cover_path: a.cover_path,
        ville: r.ville,
      });
    }
  };

  const showSale = a.transaction_type === "sale" || a.transaction_type === "both";
  const showRent = a.transaction_type === "rent" || a.transaction_type === "both";
  const main = photos[activePhoto] ?? photos[0];

  return (
    <article className="container py-10 lg:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/appartements"><ArrowLeft className="h-4 w-4" /> Tous les appartements</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8 min-w-0">
          {/* 1 — Titre */}
          <header className="space-y-2">
            <h1 className="font-display font-semibold text-balance leading-tight">{aptTitle}</h1>
            <p className="text-muted-foreground">
              {subtitleParts.join(" · ")}
            </p>
            {/* 2 — Résidence + lieu (lien cliquable) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <Link to={`/residences/${r.slug}`} className="font-medium text-primary hover:underline">
                {residenceName}
              </Link>
              {(r.ville || r.region) && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {[r.ville, r.region].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          </header>

          {/* 3 — Photo principale + miniatures */}
          <div className="mx-auto w-full" style={{ maxWidth: 860 }}>
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-muted"
              style={{ aspectRatio: "16 / 9", maxHeight: 420 }}
            >
              {main ? (
                <img src={main.url} alt={main.alt || residenceName} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200"; }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Building2 className="h-12 w-12" />
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {a.type && (
                  <span className="badge-fixed rounded-full bg-background/95 px-3 py-1 font-medium text-foreground shadow-soft">
                    {typeLabel}
                  </span>
                )}
                {a.transaction_type === "sale" && (
                  <span className="badge-fixed rounded-full bg-success px-3 py-1 font-medium text-success-foreground shadow-soft">
                    À vendre
                  </span>
                )}
                {a.transaction_type === "rent" && (
                  <span className="badge-fixed rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground shadow-soft">
                    À louer
                  </span>
                )}
                {a.transaction_type === "both" && (
                  <span className="badge-fixed rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground shadow-soft">
                    À vendre ou à louer
                  </span>
                )}
              </div>
            </div>
            {photos.length > 1 && (
              <div
                className="mt-2 flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={
                      "shrink-0 overflow-hidden rounded-lg border-2 transition " +
                      (i === activePhoto
                        ? "border-primary opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100")
                    }
                    style={{ height: 80, aspectRatio: "4 / 3" }}
                  >
                    <img src={p.url} alt={p.alt} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu */}
          <OverviewBadges a={a} />

          {/* Description */}
          {description && (
            <section>
              <h2 className="mb-3 font-display font-semibold">Description</h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/85">{description}</p>
            </section>
          )}

          {/* Sections détaillées */}
          <GeneralInfo a={a} />
          <InteriorInfo a={a} />
          <ExteriorInfo a={a} />
          <InstallationsInfo a={a} />
          <EnergyInfo a={a} />
          <FinancesInfo a={a} additionalCharges={addCharges} />

          {/* Équipements */}
          {(() => {
            const checkedDefaults = APT_BOOL_FIELDS.filter((f) => a[f]);
            if (checkedDefaults.length === 0 && customEq.length === 0) return null;
            return (
              <section>
                <h2 className="mb-3 font-display font-semibold">Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {checkedDefaults.map((f) => (
                    <span
                      key={f}
                      className="badge-fixed inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-primary"
                    >
                      <Check className="h-3.5 w-3.5" /> {APT_BOOL_LABELS[f]}
                    </span>
                  ))}
                  {customEq.map((c) => (
                    <span
                      key={c.id}
                      className="badge-fixed inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-primary"
                    >
                      <Check className="h-3.5 w-3.5" /> {c.label}
                    </span>
                  ))}
                </div>
              </section>
            );
          })()}
        </div>

        {/* 6 — Encadré prix + actions */}
        <aside
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft lg:sticky lg:top-32 lg:self-start"
          style={{ minWidth: 240, maxWidth: 320 }}
        >
          <div className="space-y-3">
            {showSale && a.sale_price != null && a.sale_price > 0 && (
              <div>
                <div className="text-muted-foreground">Prix d'achat</div>
                <div className="font-display font-semibold text-primary leading-tight">
                  {a.sale_price.toLocaleString("fr-BE")} €
                </div>
              </div>
            )}
            {showRent && a.rent_price != null && a.rent_price > 0 && (
              <div>
                <div className="text-muted-foreground">Loyer mensuel minimum</div>
                <div className="font-display font-semibold text-primary leading-tight">
                  {a.rent_price.toLocaleString("fr-BE")} €
                  <span className="text-muted-foreground"> /mois</span>
                </div>
              </div>
            )}
            {!(showSale && a.sale_price) && !(showRent && a.rent_price) && (
              <div className="text-muted-foreground">Prix sur demande</div>
            )}
          </div>

          {(() => {
            const inCompare = hasApt(a.id);
            return (
              <Button
                type="button"
                variant={inCompare ? "soft" : "outline"}
                disabled={!inCompare && isAptFull}
                onClick={() => toggleApt(a.id)}
                aria-pressed={inCompare}
                className="w-full whitespace-normal py-3 px-4 h-auto leading-tight"
              >
                {inCompare ? <Check className="h-5 w-5 shrink-0" /> : <GitCompare className="h-5 w-5 shrink-0" />}
                <span className="text-left">{inCompare ? "Dans le comparateur" : "Ajouter au comparateur"}</span>
              </Button>
            );
          })()}

          <Button
            type="button"
            variant={isSaved ? "soft" : "default"}
            className="w-full whitespace-normal py-3 px-4 h-auto leading-tight"
            onClick={onToggleSave}
            aria-pressed={isSaved}
          >
            {isSaved ? <Check className="h-5 w-5 shrink-0 text-success" /> : <Heart className="h-5 w-5 shrink-0" />}
            <span className="text-left">{isSaved ? "Enregistré" : "Enregistrer cet appartement"}</span>
          </Button>
          <Button asChild variant="outline" className="w-full whitespace-normal py-3 px-4 h-auto leading-tight">
            <Link to={`/residences/${r.slug}`}>Voir la résidence complète</Link>
          </Button>
        </aside>
      </div>
    </article>
  );
}
