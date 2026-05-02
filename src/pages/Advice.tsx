import { useI18n } from "@/modules/i18n/I18nProvider";
import { BookOpen, Lightbulb, ScrollText, HeartPulse } from "lucide-react";

const articles = [
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Comment choisir entre résidence-services et maison de repos ?",
    excerpt: "Les critères clés selon le degré d'autonomie, le budget et les besoins de soins.",
    minutes: 5,
  },
  {
    icon: <ScrollText className="h-6 w-6" />,
    title: "Quelles aides financières en Belgique ?",
    excerpt: "APA, allocations, déductions fiscales : tout ce qui peut alléger la facture mensuelle.",
    minutes: 7,
  },
  {
    icon: <HeartPulse className="h-6 w-6" />,
    title: "Préparer la transition en douceur",
    excerpt: "Conseils pratiques pour accompagner un parent vers une nouvelle vie en résidence.",
    minutes: 6,
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Les questions à poser lors d'une visite",
    excerpt: "Notre checklist complète pour ne rien oublier le jour J.",
    minutes: 4,
  },
];

export default function AdvicePage() {
  const { t } = useI18n();
  return (
    <div className="container py-12 lg:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("advice.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("advice.subtitle")}</p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {articles.map((a, i) => (
          <article
            key={i}
            className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              {a.icon}
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold leading-snug group-hover:text-primary">
              {a.title}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">{a.excerpt}</p>
            <div className="mt-4 text-sm font-medium text-accent">{a.minutes} min de lecture →</div>
          </article>
        ))}
      </div>
    </div>
  );
}
