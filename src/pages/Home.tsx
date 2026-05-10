import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, GitCompare, MapPin, ArrowRight, ShieldCheck, HeartHandshake, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { ResidenceCard } from "@/modules/residences/ResidenceCard";
import { residences } from "@/modules/residences/data";

const HERO_SLIDES = [
  { src: "/images/hero/hall-accueil.jpg", label: "Un accueil chaleureux" },
  { src: "/images/hero/batiment-chic-2.png", label: "Des résidences d'exception" },
  { src: "/images/hero/batiment-chic.png", label: "Un cadre de vie prestigieux" },
  { src: "/images/hero/jardin.jpg", label: "Des espaces verts soignés" },
  { src: "/images/hero/restaurant.jpg", label: "Une restauration de qualité" },
  { src: "/images/hero/activites.jpg", label: "Une vie sociale épanouissante" },
];

export default function HomePage() {
  const { t } = useI18n();
  const featured = residences.filter((r) => r.featured).slice(0, 3);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* HERO SLIDER */}
      <section className="relative -mt-[84px] h-screen min-h-[650px] w-full overflow-hidden">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDuration: "1500ms" }}
          >
            <img src={slide.src} alt={slide.label} className="h-full w-full object-cover object-center" />
          </div>
        ))}

        {/* Overlay sombre modéré uniforme */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Dégradé supplémentaire centré sur le texte */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/40" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6 mt-16">
          <p className="text-sm font-medium tracking-widest uppercase text-white/90 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {HERO_SLIDES[current].label}
          </p>
          <h1
            className="font-display text-5xl font-bold md:text-6xl lg:text-7xl max-w-4xl leading-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6)" }}
          >
            Une nouvelle étape,<br />en toute sérénité
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            Comparez les résidences-services, seigneuries et maisons de repos partout en Belgique.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-primary font-semibold hover:bg-white/95 shadow-xl shadow-black/30 rounded-full">
              <Link to="/residences">
                <Search className="h-5 w-5 mr-2" />
                Trouver une résidence
              </Link>
            </Button>
            <Button asChild size="lg" className="text-lg px-8 py-4 bg-white/15 border-2 border-white text-white font-semibold hover:bg-white/25 backdrop-blur-sm rounded-full shadow-lg shadow-black/20">
              <Link to="/comparateur">Utiliser le comparateur</Link>
            </Button>
          </div>

          <div className="mt-14 flex gap-10 items-center justify-center">
            {[
              { val: "1 200+", label: "Résidences" },
              { val: "10", label: "Provinces" },
              { val: "4.7★", label: "Avis moyen" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{s.val}</div>
                  <div className="text-sm mt-1 text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">{s.label}</div>
                </div>
                {i < 2 && <div className="h-8 w-px bg-white/30" />}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/35 transition-colors"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setCurrent((p) => (p + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/35 transition-colors"
          aria-label="Slide suivant"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
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
