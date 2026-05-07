import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Heart, Maximize, Layers, Building2,
  CalendarDays, Check, Home,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useFavorites } from "@/modules/favorites/useFavorites";
import { getApartmentById } from "@/modules/apartments/publicApi";
import { APT_BOOL_FIELDS, APT_BOOL_LABELS } from "@/modules/apartments/types";

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  chambre: "Chambre",
  studio: "Studio",
};

export default function ApartmentDetailPage() {
  const { tr } = useI18n();
  const { id = "" } = useParams();
  const [activePhoto, setActivePhoto] = useState(0);
  const { has, toggle } = useFavorites();

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

  const { apartment: a, residence: r, photos } = data;
  const residenceName = tr(r.nom_fr, r.nom_nl);
  const aptTitle = tr(a.description_fr, a.description_nl)
    ? `${TYPE_LABEL[a.type ?? "appartement"] ?? "Logement"} ${a.surface_m2 ? `de ${a.surface_m2} m²` : ""}`.trim()
    : `${TYPE_LABEL[a.type ?? "appartement"] ?? "Logement"} ${a.surface_m2 ? `de ${a.surface_m2} m²` : ""}`.trim();
  const description = tr(a.description_fr, a.description_nl);
  const isFav = has(r.id);

  const showSale = a.transaction_type === "sale" || a.transaction_type === "both";
  const showRent = a.transaction_type === "rent" || a.transaction_type === "both";
  const main = photos[activePhoto] ?? photos[0];

  return (
    <article className="container py-10 lg:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/appartements"><ArrowLeft className="h-4 w-4" /> Tous les appartements</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Galerie */}
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
              {main ? (
                <img src={main.url} alt={main.alt || residenceName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Building2 className="h-12 w-12" />
                </div>
              )}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {a.type && (
                  <span className="badge-fixed rounded-full bg-background/95 px-3 py-1.5 font-medium text-foreground shadow-soft">
                    {TYPE_LABEL[a.type] ?? a.type}
                  </span>
                )}
                {showSale && (
                  <span className="badge-fixed rounded-full bg-success px-3 py-1.5 font-medium text-success-foreground shadow-soft">
                    À vendre
                  </span>
                )}
                {!showSale && showRent && (
                  <span className="badge-fixed rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground shadow-soft">
                    À louer
                  </span>
                )}
              </div>
            </div>
            {photos.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {photos.slice(0, 12).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={
                      "aspect-square overflow-hidden rounded-lg border-2 transition " +
                      (i === activePhoto ? "border-primary" : "border-transparent hover:border-border")
                    }
                  >
                    <img src={p.url} alt={p.alt} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Titre + résidence + localisation */}
          <header className="space-y-3">
            <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{aptTitle}</h1>
            <p className="text-lg">
              <Link to={`/residences/${r.slug}`} className="font-medium text-primary hover:underline">
                {residenceName}
              </Link>
            </p>
            {(r.ville || r.region) && (
              <div className="flex items-center gap-1.5 text-base text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{[r.ville, r.region].filter(Boolean).join(" · ")}</span>
              </div>
            )}
          </header>

          {/* Infos clés */}
          <section className="grid grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:grid-cols-4">
            <KeyInfo icon={<Maximize className="h-5 w-5" />} label="Surface" value={a.surface_m2 ? `${a.surface_m2} m²` : "—"} />
            <KeyInfo icon={<Layers className="h-5 w-5" />} label="Étage" value={a.floor != null ? String(a.floor) : "—"} />
            <KeyInfo icon={<Home className="h-5 w-5" />} label="Type" value={a.type ? (TYPE_LABEL[a.type] ?? a.type) : "—"} />
            <KeyInfo
              icon={<CalendarDays className="h-5 w-5" />}
              label="Disponible"
              value={a.available_from ? new Date(a.available_from).toLocaleDateString("fr-BE") : "Immédiatement"}
            />
          </section>

          {/* Description */}
          {description && (
            <section>
              <h2 className="mb-3 font-display text-2xl font-semibold">Description</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-foreground/85">{description}</p>
            </section>
          )}

          {/* Équipements */}
          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold">Équipements</h2>
            <div className="flex flex-wrap gap-2">
              {APT_BOOL_FIELDS.filter((f) => a[f]).map((f) => (
                <span
                  key={f}
                  className="badge-fixed inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-primary"
                >
                  <Check className="h-3.5 w-3.5" /> {APT_BOOL_LABELS[f]}
                </span>
              ))}
              {APT_BOOL_FIELDS.every((f) => !a[f]) && (
                <span className="text-muted-foreground">Aucun équipement renseigné.</span>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div>
              {showSale && a.sale_price != null && (
                <div>
                  <div className="text-sm text-muted-foreground">Prix d'achat</div>
                  <div className="font-display text-3xl font-semibold text-primary">
                    {a.sale_price.toLocaleString("fr-BE")} €
                  </div>
                </div>
              )}
              {showRent && a.rent_price != null && (
                <div className={showSale ? "mt-3" : ""}>
                  <div className="text-sm text-muted-foreground">Loyer mensuel</div>
                  <div className="font-display text-3xl font-semibold text-primary">
                    {a.rent_price.toLocaleString("fr-BE")} €<span className="text-base text-muted-foreground"> /mois</span>
                  </div>
                </div>
              )}
              {!showSale && !showRent && (
                <div className="text-base text-muted-foreground">Prix sur demande</div>
              )}
            </div>

            <Button
              type="button"
              size="lg"
              variant={isFav ? "soft" : "default"}
              className="w-full"
              onClick={() => toggle(r.id)}
              aria-pressed={isFav}
            >
              <Heart className={"h-5 w-5 " + (isFav ? "fill-current" : "")} />
              {isFav ? "Enregistré dans vos favoris" : "Enregistrer cet appartement"}
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to={`/residences/${r.slug}`}>Voir la résidence complète</Link>
            </Button>
          </div>

          {/* Encadré résidence */}
          <Link
            to={`/residences/${r.slug}`}
            className="block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:shadow-elegant"
          >
            <div className="aspect-[16/10] bg-muted">
              {main && <img src={main.url} alt={residenceName} className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Résidence</div>
              <div className="mt-1 font-display text-lg font-semibold leading-tight">{residenceName}</div>
              {r.ville && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {r.ville}
                </div>
              )}
              <span className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Voir la résidence →
              </span>
            </div>
          </Link>
        </aside>
      </div>
    </article>
  );
}

function KeyInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">{icon} {label}</div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
