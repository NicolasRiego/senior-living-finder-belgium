import { Link } from "react-router-dom";
import { Search, GitCompare, MapPin, ArrowRight, Sparkles, ShieldCheck, HeartHandshake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { ResidenceCard } from "@/modules/residences/ResidenceCard";
import { residences } from "@/modules/residences/data";
import heroImg from "@/assets/hero-residence.jpg";

export default function HomePage() {
  const { t } = useI18n();
  const featured = residences.filter((r) => r.featured).slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
        </div>

        <div className="container relative grid min-h-[640px] items-center py-20 lg:py-28">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> {t("home.trustLine")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] text-balance md:text-5xl lg:text-[3.75rem]">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/residences"><Search /> {t("home.ctaSearch")}</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/comparateur"><GitCompare /> {t("home.ctaCompare")}</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { v: "1 200+", l: "Résidences" },
                { v: "10", l: "Provinces" },
                { v: "4.7★", l: "Avis moyen" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-semibold text-primary">{s.v}</div>
                  <div className="text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="container py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("home.howTitle")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("home.howSubtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { i: <Search className="h-7 w-7" />, t: t("home.step1Title"), b: t("home.step1Body") },
            { i: <GitCompare className="h-7 w-7" />, t: t("home.step2Title"), b: t("home.step2Body") },
            { i: <MapPin className="h-7 w-7" />, t: t("home.step3Title"), b: t("home.step3Body") },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                {s.i}
              </div>
              <div className="mb-1 text-sm font-semibold text-accent">0{i + 1}</div>
              <h3 className="font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-base text-muted-foreground">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-muted/40 py-20 lg:py-28">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("home.featuredTitle")}</h2>
              <p className="mt-3 text-lg text-muted-foreground">{t("home.featuredSubtitle")}</p>
            </div>
            <Button asChild variant="ghost" size="default">
              <Link to="/residences">{t("common.seeAll")} <ArrowRight /></Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <ResidenceCard key={r.id} residence={r} />
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="container py-20 lg:py-28">
        <div className="rounded-3xl bg-gradient-warm p-10 md:p-16 shadow-soft">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("home.valuesTitle")}</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { i: <ShieldCheck className="h-6 w-6" />, t: t("home.val1") },
              { i: <Star className="h-6 w-6" />, t: t("home.val2") },
              { i: <HeartHandshake className="h-6 w-6" />, t: t("home.val3") },
            ].map((v, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                  {v.i}
                </span>
                <p className="pt-2 text-lg font-medium">{v.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
