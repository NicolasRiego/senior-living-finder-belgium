import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Users, Check, Phone, Mail, BadgeCheck, Accessibility, CalendarDays, FileText, GitCompare } from "lucide-react";
import { useCompare } from "@/modules/compare/CompareProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { getResidenceFullBySlug } from "@/modules/residences/publicApi";
import { trackResidenceEvent } from "@/modules/analytics/track";
import { supabase } from "@/integrations/supabase/client";

type CTAType = "brochure" | "visit" | "callback";

export default function ResidenceDetailPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["residence-detail", slug],
    queryFn: () => getResidenceFullBySlug(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.residence?.id) trackResidenceEvent(data.residence.id, "view");
  }, [data?.residence?.id]);

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

  const { residence: r, units, pricing, services, activities, photos } = data;
  const cover = photos.find((p) => p.cover) ?? photos[0];
  const minPrice = pricing
    .map((p: any) => p.estimated_monthly_min ?? p.rent_min)
    .filter((v: any) => v != null)
    .reduce((m: number | null, v: number) => (m == null ? v : Math.min(m, v)), null);

  return (
    <article className="pb-32">
      {/* Hero */}
      <div className="relative h-[420px] w-full overflow-hidden md:h-[520px] bg-muted">
        {cover ? (
          <img src={cover.url} alt={cover.alt || r.nom_fr} className="h-full w-full object-cover" />
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
              <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{r.nom_fr}</h1>
              {r.tagline_fr && (
                <p className="mt-2 text-lg text-muted-foreground">{r.tagline_fr}</p>
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
              {minPrice != null && (
                <div>
                  <div className="text-sm text-muted-foreground">{t("common.from")}</div>
                  <div className="font-display text-3xl font-semibold text-primary">
                    {Number(minPrice).toLocaleString("fr-BE")}€<span className="text-base font-normal text-muted-foreground">{t("common.perMonth")}</span>
                  </div>
                </div>
              )}
              <CompareToggle id={r.id} />
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-12">
              {/* Résumé */}
              {r.description_fr && (
                <Section id="resume" title="Résumé">
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">{r.description_fr}</p>
                </Section>
              )}

              {/* Logements */}
              {units.length > 0 && (
                <Section id="logements" title="Logements">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {units.map((u: any) => (
                      <div key={u.id} className="rounded-xl border border-border/60 bg-muted/30 p-5">
                        <div className="font-semibold text-lg">{u.type}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {u.surface_min ? `${u.surface_min}${u.surface_max ? `–${u.surface_max}` : ""} m²` : null}
                          {u.surface_min && u.count_total ? " · " : null}
                          {u.count_total ? `${u.count_total} unités` : null}
                        </div>
                        <div className="mt-2 text-sm">
                          {u.available_now ? (
                            <span className="inline-flex items-center gap-1 text-primary"><Check className="h-3.5 w-3.5" /> Disponible maintenant</span>
                          ) : u.waiting_list ? (
                            <span className="text-muted-foreground">Liste d'attente {u.waiting_delay_days ? `(~${u.waiting_delay_days}j)` : ""}</span>
                          ) : (
                            <span className="text-muted-foreground">{u.available_count ?? 0} disponible(s)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Coût réel */}
              {pricing.length > 0 && (
                <Section id="cout" title="Coût réel">
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="p-3">Logement</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Loyer</th>
                          <th className="p-3">Charges</th>
                          <th className="p-3">Estimation / mois</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing.map((p: any) => {
                          const u = units.find((u: any) => u.id === p.unit_type_id);
                          return (
                            <tr key={p.id} className="border-t border-border/60">
                              <td className="p-3">{u?.type ?? "—"}</td>
                              <td className="p-3 capitalize">{p.occupation_mode}</td>
                              <td className="p-3">{p.rent_min ? `${p.rent_min}${p.rent_max ? `–${p.rent_max}` : ""} €` : "—"}</td>
                              <td className="p-3">{p.fixed_charges ? `${p.fixed_charges} €` : "—"}</td>
                              <td className="p-3 font-medium">
                                {p.estimated_monthly_min
                                  ? `${p.estimated_monthly_min}${p.estimated_monthly_max ? `–${p.estimated_monthly_max}` : ""} €`
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {/* Services */}
              {services.length > 0 && (
                <Section id="services" title="Services">
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {services.map((s: any) => (
                      <li key={s.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-base">
                        <span className={"flex h-8 w-8 items-center justify-center rounded-full " + (s.included ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{s.services_catalog?.label_fr ?? "Service"}</span>
                        {s.optional && <span className="text-xs text-muted-foreground">Optionnel</span>}
                        {s.price && <span className="text-sm font-medium">{s.price} €</span>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Activités */}
              {activities.length > 0 && (
                <Section id="activites" title="Activités">
                  <div className="flex flex-wrap gap-2">
                    {activities.map((a: any) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm text-primary">
                        {a.activities_catalog?.label_fr ?? "Activité"}
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
                <CTAButton residenceId={r.id} type="visit" label={t("detail.requestVisit")} icon={<CalendarDays />} variant="hero" />
                <CTAButton residenceId={r.id} type="brochure" label="Recevoir la brochure" icon={<FileText />} variant="outline" />
                <CTAButton residenceId={r.id} type="callback" label="Être rappelé" icon={<Phone />} variant="outline" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Persistent mobile CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="container flex gap-2">
          <CTAButton residenceId={r.id} type="visit" label="Visite" icon={<CalendarDays />} variant="hero" className="flex-1" />
          <CTAButton residenceId={r.id} type="brochure" label="Brochure" icon={<FileText />} variant="outline" className="flex-1" />
          <CTAButton residenceId={r.id} type="callback" label="Rappel" icon={<Phone />} variant="outline" className="flex-1" />
        </div>
      </div>
    </article>
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

function CTAButton({
  residenceId,
  type,
  label,
  icon,
  variant = "default",
  className,
}: {
  residenceId: string;
  type: CTAType;
  label: string;
  icon: React.ReactNode;
  variant?: "hero" | "outline" | "default";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });

  const titles: Record<CTAType, string> = {
    brochure: "Recevoir la brochure",
    visit: "Demander une visite",
    callback: "Être rappelé",
  };

  const submit = async () => {
    if (!form.consent) {
      toast({ title: "Veuillez accepter le RGPD", variant: "destructive" });
      return;
    }
    if (!form.name || !form.email) {
      toast({ title: "Nom et e-mail requis", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      residence_id: residenceId,
      contact_name: form.name,
      contact_email: form.email,
      contact_phone: form.phone || null,
      message: form.message
        ? `[${titles[type]}] ${form.message}`
        : `[${titles[type]}]`,
      consent_rgpd: true,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur lors de l'envoi", description: error.message, variant: "destructive" });
      return;
    }
    trackResidenceEvent(residenceId, `lead_${type}`);
    toast({ title: "Demande envoyée", description: "Nous vous recontactons rapidement." });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", message: "", consent: false });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="lg" className={"w-full " + (className ?? "")}>{icon}{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {type !== "callback" && (
            <div>
              <Label>Message</Label>
              <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
          )}
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-1"
            />
            J'accepte que mes données soient utilisées pour traiter ma demande (RGPD).
          </label>
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
