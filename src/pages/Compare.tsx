import { Link } from "react-router-dom";
import { X, Check, Star, Users, MapPin, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import { residences } from "@/modules/residences/data";

export default function ComparePage() {
  const { t } = useI18n();
  const { ids, remove, clear } = useCompare();
  const items = residences.filter((r) => ids.includes(r.id));

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <GitCompare className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold">{t("compare.title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("compare.empty")}</p>
          <Button asChild variant="hero" size="lg" className="mt-6">
            <Link to="/residences">{t("compare.browse")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const allServices = Array.from(new Set(items.flatMap((r) => r.services)));

  return (
    <div className="container py-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("compare.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("compare.subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={clear}>{t("common.removeFromCompare")}</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-x-4">
          <thead>
            <tr>
              <th className="w-44 text-left text-sm font-semibold text-muted-foreground">{t("compare.criterion")}</th>
              {items.map((r) => (
                <th key={r.id} className="text-left align-bottom">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
                    <div className="relative aspect-[4/3]">
                      <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                      <button
                        onClick={() => remove(r.id)}
                        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Retirer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <Link to={`/residences/${r.slug}`} className="block font-display text-lg font-semibold hover:text-primary">
                        {r.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {r.city}
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base">
            <Row label={t("common.type")}>
              {items.map((r) => <span key={r.id}>{t(`residenceTypes.${r.type}`)}</span>)}
            </Row>
            <Row label={t("common.price")}>
              {items.map((r) => (
                <span key={r.id} className="font-semibold text-primary">
                  {r.priceFrom.toLocaleString("fr-BE")}€<span className="text-sm font-normal text-muted-foreground">{t("common.perMonth")}</span>
                </span>
              ))}
            </Row>
            <Row label={t("detail.capacity")}>
              {items.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /> {r.capacity}</span>
              ))}
            </Row>
            <Row label="Note">
              {items.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-accent" fill="currentColor" /> {r.rating.toFixed(1)}</span>
              ))}
            </Row>
            {allServices.map((s) => (
              <Row key={s} label={s}>
                {items.map((r) => (
                  <span key={r.id}>
                    {r.services.includes(s) ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </span>
                ))}
              </Row>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border/40">
      <td className="py-4 align-top text-sm font-medium text-muted-foreground">{label}</td>
      {children.map((c, i) => (
        <td key={i} className="py-4 align-top">
          {c}
        </td>
      ))}
    </tr>
  );
}
