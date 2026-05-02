import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Star, Check, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import { getResidenceBySlug } from "@/modules/residences/data";

export default function ResidenceDetailPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const r = getResidenceBySlug(slug);
  const { has, toggle } = useCompare();

  if (!r) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("notFound.title")}</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/residences"><ArrowLeft /> {t("nav.residences")}</Link>
        </Button>
      </div>
    );
  }

  const inCompare = has(r.id);

  return (
    <article className="pb-20">
      {/* Hero */}
      <div className="relative h-[420px] w-full overflow-hidden md:h-[520px]">
        <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="container -mt-24 relative">
        <div className="rounded-3xl bg-card p-8 shadow-elegant md:p-12">
          <Link to="/residences" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("nav.residences")}
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                {t(`residenceTypes.${r.type}`)}
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{r.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {r.city} · {r.region}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {r.capacity} {t("detail.units")}</span>
                <span className="inline-flex items-center gap-1.5 text-foreground"><Star className="h-4 w-4 text-accent" fill="currentColor" /> {r.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t("common.from")}</div>
              <div className="font-display text-3xl font-semibold text-primary">
                {r.priceFrom.toLocaleString("fr-BE")}€<span className="text-base font-normal text-muted-foreground">{t("common.perMonth")}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="hero" size="default">{t("detail.requestVisit")}</Button>
                <Button variant="outline" size="default" onClick={() => toggle(r.id)}>
                  {inCompare ? <><Check /> {t("common.removeFromCompare")}</> : t("common.addToCompare")}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-10">
              <section>
                <h2 className="font-display text-2xl font-semibold">{t("detail.overview")}</h2>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{r.description}</p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold">{t("detail.services")}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {r.services.map((s) => (
                    <li key={s} className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-base">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold">{t("detail.location")}</h2>
                <div className="mt-4 flex aspect-[16/9] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5" /> {r.city}, {r.region}
                </div>
              </section>
            </div>

            <aside className="rounded-2xl border border-border/60 bg-gradient-warm p-6 lg:sticky lg:top-28 lg:h-fit">
              <h3 className="font-display text-xl font-semibold">{t("detail.requestInfo")}</h3>
              <p className="mt-2 text-base text-muted-foreground">Notre conseiller vous répond sous 24h.</p>
              <div className="mt-6 space-y-3">
                <Button variant="hero" size="lg" className="w-full">{t("detail.requestVisit")}</Button>
                <Button variant="outline" size="lg" className="w-full"><Phone /> +32 2 000 00 00</Button>
                <Button variant="outline" size="lg" className="w-full"><Mail /> Écrire un e-mail</Button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
