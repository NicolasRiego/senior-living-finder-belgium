import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Users, Check, Phone, Mail, CalendarDays, FileText, GitCompare, ExternalLink } from "lucide-react";
import { useCompare } from "@/modules/compare/CompareProvider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { getResidenceFullBySlug, type PublicUnitSummary } from "@/modules/residences/publicApi";
import { trackResidenceEvent } from "@/modules/analytics/track";
import { LeadFormDialog, type LeadIntent } from "@/modules/leads/LeadFormDialog";
import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import CostsSection from "@/modules/residences/CostsSection";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(UNIT_TYPES.map((t) => [t.value, t.label]));


export default function ResidenceDetailPage() {
  const { t, tr } = useI18n();
  const { slug = "" } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["residence-detail", slug],
    queryFn: () => getResidenceFullBySlug(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.residence?.id) trackResidenceEvent(data.residence.id, "view");
  }, [data?.residence?.id]);

  const unitSummariesForPrice = (data?.unitSummaries ?? []) as PublicUnitSummary[];
  const chargesForPrice = (data?.charges ?? []) as import("@/modules/residences/CostsSection").ResidenceCharge[];
  const totalMandatoryCharges = chargesForPrice.reduce(
    (sum, c) => sum + (c.amount ?? 0),
    0,
  );
  const priceFromWithCharges = useMemo(() => {
    const allRentMins = unitSummariesForPrice
      .filter((s) => s.hasRent && s.rentMin)
      .map((s) => s.rentMin as number);
    if (allRentMins.length === 0) return null;
    return Math.min(...allRentMins) + totalMandatoryCharges;
  }, [unitSummariesForPrice, totalMandatoryCharges]);

  if (isLoading) {
    return <div className="container py-24 text-center text-muted-foreground">Chargement…</div>;
  }
  if (!data) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("notFound.title")}</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/residences"><ArrowLeft /> {t("nav.residences")}</Link>
        </Button>
      </div>
    );
  }

  const { residence: r, unitSummaries = [], services, activities, photos, charges = [] } = data as typeof data & { unitSummaries?: PublicUnitSummary[]; charges?: import("@/modules/residences/CostsSection").ResidenceCharge[] };
  const cover = photos.find((p) => p.cover) ?? photos[0];
  const name = tr(r.nom_fr, r.nom_nl);
  const tagline = tr(r.tagline_fr, r.tagline_nl);
  const description = tr(r.description_fr, r.description_nl);

  return (
    <article className="pb-32">
      {/* Hero */}
      <div className="relative h-[420px] w-full overflow-hidden md:h-[520px] bg-muted">
        {cover ? (
          <img src={cover.url} alt={cover.alt || name} className="h-full w-full object-cover" />
        ) : null}
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
                {t(`residenceTypes.${r.type_etablissement}`)}
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{name}</h1>
              {tagline && (
                <p className="mt-2 text-lg text-muted-foreground">{tagline}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                {(r.ville || r.region) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {[r.ville, r.region].filter(Boolean).join(" · ")}
                  </span>
                )}
                {r.capacity && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {r.capacity} {t("detail.units")}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right space-y-3">
              {priceFromWithCharges != null && (
                <div>
                  <div className="text-sm text-muted-foreground">{t("common.from")}</div>
                  <div className="font-display text-3xl font-bold text-primary">
                    {priceFromWithCharges.toLocaleString("fr-BE")}€<span className="text-base font-normal text-muted-foreground">{t("common.perMonth")}</span>
                  </div>
                  {totalMandatoryCharges > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Loyer + charges obligatoires incluses
                    </div>
                  )}
                </div>
              )}
              <CompareToggle id={r.id} />
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-12">
              {/* Résumé */}
              {description && (
                <Section id="resume" title="Résumé">
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">{description}</p>
                </Section>
              )}

              {/* Logements */}
              {unitSummaries.length > 0 && (
                <Section id="logements" title="Logements & tarifs">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                      <div className="text-3xl font-bold text-primary">
                        {unitSummaries.reduce((t, s) => t + s.total, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Total logements</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {unitSummaries.reduce((t, s) => t + s.available, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Disponibles</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                      <div className="text-3xl font-bold">{unitSummaries.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Types différents</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {unitSummaries.map((s) => (
                      <div key={s.type} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{TYPE_LABEL[s.type] ?? s.type}</h3>
                          <div className="flex gap-1.5">
                            {s.hasRent && (
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium whitespace-nowrap">
                                À louer
                              </span>
                            )}
                            {s.hasSale && (
                              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700 font-medium whitespace-nowrap">
                                À vendre
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Total</div>
                            <div className="font-semibold">{s.total} logement{s.total > 1 ? "s" : ""}</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Disponibles</div>
                            <div className="font-semibold text-green-600">{s.available} / {s.total}</div>
                          </div>
                          {(s.surfaceMin || s.surfaceMax) && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Surface</div>
                              <div className="font-semibold">
                                {s.surfaceMin === s.surfaceMax
                                  ? `${s.surfaceMin} m²`
                                  : `${s.surfaceMin ?? "?"}–${s.surfaceMax ?? "?"} m²`}
                              </div>
                            </div>
                          )}
                          {s.hasRent && s.rentMin && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Loyer</div>
                              <div className="font-semibold text-primary">
                                {s.rentMin === s.rentMax || !s.rentMax
                                  ? `${s.rentMin.toLocaleString("fr-BE")} €/mois`
                                  : `${s.rentMin.toLocaleString("fr-BE")}–${s.rentMax.toLocaleString("fr-BE")} €/mois`}
                              </div>
                            </div>
                          )}
                          {s.hasSale && s.saleMin && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Achat dès</div>
                              <div className="font-semibold">{s.saleMin.toLocaleString("fr-BE")} €</div>
                            </div>
                          )}
                          {s.pmr > 0 && (
                            <div className="rounded-lg bg-muted/50 px-3 py-2">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Accessibles PMR</div>
                              <div className="font-semibold">{s.pmr} logement{s.pmr > 1 ? "s" : ""}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 text-center">
                    <Link
                      to={`/appartements?residences=${r.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Voir tous les appartements disponibles →
                    </Link>
                  </div>
                </Section>
              )}


              {/* Coûts */}
              {charges.length > 0 && unitSummaries.length > 0 && (
                <Section id="couts" title="Coûts mensuels estimés">
                  <CostsSection charges={charges} unitSummaries={unitSummaries} />
                </Section>
              )}

              {/* Services */}
              {services.length > 0 && (
                <Section id="services" title="Services">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((s: any) => {
                      const label = tr(s.services_catalog?.label_fr, s.services_catalog?.label_nl) || "Service";
                      const isFromCharges = s.from_charges === true;
                      const isFree = s.is_free === true;
                      const isOptional = s.optional === true;
                      const price = s.price ?? null;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-4 w-4" />
                            </span>
                            <span className="font-medium text-sm">{label}</span>
                          </div>
                          <div className="shrink-0">
                            {isFromCharges ? (
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium whitespace-nowrap">
                                Inclus dans les charges
                              </span>
                            ) : isFree ? (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700 font-medium">
                                Gratuit
                              </span>
                            ) : isOptional && price ? (
                              <div className="flex items-center gap-1.5">
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  Optionnel
                                </span>
                                <span className="text-sm font-semibold">
                                  {Number(price).toLocaleString("fr-BE")} €/mois
                                </span>
                              </div>
                            ) : isOptional ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Optionnel
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Activités */}
              {activities.length > 0 && (
                <Section id="activites" title="Activités">
                  <div className="flex flex-wrap gap-2">
                    {activities.map((a: any) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm text-primary">
                        {tr(a.activities_catalog?.label_fr, a.activities_catalog?.label_nl) || "Activité"}
                        {a.frequency && <span className="text-xs opacity-70">· {a.frequency}</span>}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Galerie */}
              {photos.length > 0 && (
                <Section id="galerie" title="Galerie">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {photos.map((p) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                        <img src={p.url} alt={p.alt} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {/* Contact */}
              <Section id="contact" title="Contact">
                <div className="grid gap-2 text-base">
                  {r.adresse && (
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {r.adresse}, {r.code_postal} {r.ville}</p>
                  )}
                  {r.contact_phone && (
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {r.contact_phone}</p>
                  )}
                  {r.contact_email && (
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {r.contact_email}</p>
                  )}
                </div>
              </Section>
            </div>

            <aside className="rounded-2xl border border-border/60 bg-gradient-warm p-6 lg:sticky lg:top-28 lg:h-fit">
              <h3 className="font-display text-xl font-semibold">{t("detail.requestInfo")}</h3>
              <p className="mt-2 text-base text-muted-foreground">Notre conseiller vous répond sous 24h.</p>
              <div className="mt-6 space-y-3">
                <CTASlot residenceId={r.id} intent="visit" label={t("detail.requestVisit")} icon={<CalendarDays />} variant="hero" />
                <CTASlot residenceId={r.id} intent="brochure" label="Recevoir la brochure" icon={<FileText />} variant="outline" />
                <CTASlot residenceId={r.id} intent="callback" label="Être rappelé" icon={<Phone />} variant="outline" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Persistent mobile CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="container flex gap-2">
          <CTASlot residenceId={r.id} intent="visit" label="Visite" icon={<CalendarDays />} variant="hero" className="flex-1" />
          <CTASlot residenceId={r.id} intent="brochure" label="Brochure" icon={<FileText />} variant="outline" className="flex-1" />
          <CTASlot residenceId={r.id} intent="callback" label="Rappel" icon={<Phone />} variant="outline" className="flex-1" />
        </div>
      </div>
    </article>
  );
}

function CTASlot({
  residenceId, intent, label, icon, variant = "default", className,
}: {
  residenceId: string;
  intent: LeadIntent;
  label: string;
  icon: React.ReactNode;
  variant?: "hero" | "outline" | "default";
  className?: string;
}) {
  return (
    <LeadFormDialog
      residenceId={residenceId}
      intent={intent}
      trigger={
        <Button variant={variant} size="lg" className={"w-full " + (className ?? "")}>
          {icon}{label}
        </Button>
      }
    />
  );
}

function CompareToggle({ id }: { id: string }) {
  const { has, toggle, isFull } = useCompare();
  const inCompare = has(id);
  return (
    <Button
      type="button"
      variant={inCompare ? "soft" : "outline"}
      size="sm"
      disabled={!inCompare && isFull}
      onClick={() => toggle(id)}
      aria-pressed={inCompare}
    >
      {inCompare ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
      {inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
    </Button>
  );
}


function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

