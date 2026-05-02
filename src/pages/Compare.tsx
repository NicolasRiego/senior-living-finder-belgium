import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Check, MapPin, GitCompare, Mail, Phone, Share2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import { fetchCompareItems, fetchServicesLabels, fetchActivitiesLabels, type CompareItem } from "@/modules/residences/compareApi";

const TYPE_LABEL_KEY = (t: string) => `residenceTypes.${t}`;

export default function ComparePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { ids, remove, clear, setIds } = useCompare();
  const [sp, setSp] = useSearchParams();

  // Hydrate from URL on first load (URL wins if present)
  useEffect(() => {
    const fromUrl = (sp.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (fromUrl.length > 0) {
      const merged = Array.from(new Set([...fromUrl, ...ids])).slice(0, 4);
      if (JSON.stringify(merged) !== JSON.stringify(ids)) setIds(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL when ids change
  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (ids.length) next.set("ids", ids.join(","));
    else next.delete("ids");
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  const query = useQuery({
    queryKey: ["compare-items", ids],
    queryFn: () => fetchCompareItems(ids),
    enabled: ids.length > 0,
  });

  const items = query.data ?? [];

  const allServiceCodes = useMemo(
    () => Array.from(new Set(items.flatMap((i) => Array.from(i.service_codes)))),
    [items],
  );
  const allActivityCodes = useMemo(
    () => Array.from(new Set(items.flatMap((i) => Array.from(i.activity_codes)))),
    [items],
  );
  const allProximityKeys = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) Object.keys(i.proximity ?? {}).forEach((k) => set.add(k));
    return Array.from(set);
  }, [items]);

  const serviceLabels = useQuery({
    queryKey: ["service-labels", allServiceCodes],
    queryFn: () => fetchServicesLabels(allServiceCodes),
    enabled: allServiceCodes.length > 0,
  });
  const activityLabels = useQuery({
    queryKey: ["activity-labels", allActivityCodes],
    queryFn: () => fetchActivitiesLabels(allActivityCodes),
    enabled: allActivityCodes.length > 0,
  });

  const share = async () => {
    const url = `${window.location.origin}/comparateur?ids=${ids.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Lien copié", description: "Vous pouvez le partager." });
    } catch {
      toast({ title: "Lien", description: url });
    }
  };

  if (ids.length === 0) {
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

  if (query.isLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="container py-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("compare.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {items.length} résidence{items.length > 1 ? "s" : ""} comparée{items.length > 1 ? "s" : ""} (2 à 4)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" /> Partager</Button>
          {items.length < 4 && (
            <Button asChild variant="outline"><Link to="/residences"><Plus className="h-4 w-4" /> Ajouter</Link></Button>
          )}
          <Button variant="ghost" onClick={clear}>Vider</Button>
        </div>
      </div>

      {items.length < 2 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Sélectionnez au moins 2 résidences pour activer la comparaison complète.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-x-4">
          <thead>
            <tr>
              <th className="w-48 text-left text-sm font-semibold text-muted-foreground align-bottom pb-2">
                {t("compare.criterion")}
              </th>
              {items.map((r) => (
                <th key={r.id} className="text-left align-bottom">
                  <ColumnHeader item={r} onRemove={() => remove(r.id)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base">
            <SectionHeader label="Général" colSpan={items.length + 1} />
            <Row label={t("common.type")}>
              {items.map((r) => <span key={r.id}>{t(TYPE_LABEL_KEY(r.type_etablissement))}</span>)}
            </Row>
            <Row label="Localisation">
              {items.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {[r.ville, r.region].filter(Boolean).join(" · ") || "—"}
                </span>
              ))}
            </Row>
            <Row label="Capacité">
              {items.map((r) => <span key={r.id}>{r.capacity ?? "—"}</span>)}
            </Row>

            <SectionHeader label="Prix & coûts" colSpan={items.length + 1} />
            <Row label={t("common.from")}>
              {items.map((r) => (
                <span key={r.id} className="font-semibold text-primary">
                  {r.price_from != null
                    ? <>{Number(r.price_from).toLocaleString("fr-BE")}€<span className="text-sm font-normal text-muted-foreground">{t("common.perMonth")}</span></>
                    : "—"}
                </span>
              ))}
            </Row>
            <Row label="Loyer min">
              {items.map((r) => (
                <span key={r.id}>{r.rent_from != null ? `${Number(r.rent_from).toLocaleString("fr-BE")} €` : "—"}</span>
              ))}
            </Row>
            <Row label="Coût estimé / mois">
              {items.map((r) => {
                const mins = r.pricing.map((p) => p.estimated_monthly_min).filter((v): v is number => v != null);
                const maxs = r.pricing.map((p) => p.estimated_monthly_max).filter((v): v is number => v != null);
                if (!mins.length) return <span key={r.id}>—</span>;
                const min = Math.min(...mins);
                const max = maxs.length ? Math.max(...maxs) : null;
                return (
                  <span key={r.id}>
                    {min.toLocaleString("fr-BE")}{max ? ` – ${max.toLocaleString("fr-BE")}` : ""} €
                  </span>
                );
              })}
            </Row>

            <SectionHeader label="Surfaces" colSpan={items.length + 1} />
            <Row label="Surface min">
              {items.map((r) => {
                const v = r.units.map((u) => u.surface_min).filter((x): x is number => x != null);
                return <span key={r.id}>{v.length ? `${Math.min(...v)} m²` : "—"}</span>;
              })}
            </Row>
            <Row label="Surface max">
              {items.map((r) => {
                const v = r.units.map((u) => u.surface_max).filter((x): x is number => x != null);
                return <span key={r.id}>{v.length ? `${Math.max(...v)} m²` : "—"}</span>;
              })}
            </Row>
            <Row label="Types de logements">
              {items.map((r) => (
                <span key={r.id} className="text-sm">
                  {r.units.length ? Array.from(new Set(r.units.map((u) => u.type))).join(", ") : "—"}
                </span>
              ))}
            </Row>

            <SectionHeader label="Accessibilité & disponibilité" colSpan={items.length + 1} />
            <Row label="Accessibilité PMR">
              {items.map((r) => <BoolCell key={r.id} value={r.is_pmr} />)}
            </Row>
            <Row label="Disponibilité">
              {items.map((r) => <BoolCell key={r.id} value={r.has_availability} />)}
            </Row>

            {allServiceCodes.length > 0 && (
              <>
                <SectionHeader label="Services" colSpan={items.length + 1} />
                {allServiceCodes.map((code) => (
                  <Row key={code} label={serviceLabels.data?.get(code) ?? code}>
                    {items.map((r) => <BoolCell key={r.id} value={r.service_codes.has(code)} />)}
                  </Row>
                ))}
              </>
            )}

            {allActivityCodes.length > 0 && (
              <>
                <SectionHeader label="Activités" colSpan={items.length + 1} />
                {allActivityCodes.map((code) => (
                  <Row key={code} label={activityLabels.data?.get(code) ?? code}>
                    {items.map((r) => <BoolCell key={r.id} value={r.activity_codes.has(code)} />)}
                  </Row>
                ))}
              </>
            )}

            {allProximityKeys.length > 0 && (
              <>
                <SectionHeader label="Proximité" colSpan={items.length + 1} />
                {allProximityKeys.map((key) => (
                  <Row key={key} label={key}>
                    {items.map((r) => {
                      const v = r.proximity?.[key];
                      if (typeof v === "boolean") return <BoolCell key={r.id} value={v} />;
                      return <span key={r.id} className="text-sm">{v != null ? String(v) : "—"}</span>;
                    })}
                  </Row>
                ))}
              </>
            )}

            <SectionHeader label="Action" colSpan={items.length + 1} />
            <tr>
              <td className="py-4 text-sm font-medium text-muted-foreground">Contact</td>
              {items.map((r) => (
                <td key={r.id} className="py-4 align-top">
                  <Button asChild size="sm" variant="hero">
                    <Link to={`/residences/${r.slug}#contact`}>Contacter</Link>
                  </Button>
                  <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                    {r.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.contact_phone}</span>}
                    {r.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.contact_email}</span>}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnHeader({ item, onRemove }: { item: CompareItem; onRemove: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft min-w-[200px]">
      <div className="relative aspect-[4/3] bg-muted">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.nom_fr} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground"><MapPin className="h-8 w-8" /></div>
        )}
        <button
          onClick={onRemove}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Retirer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        <Link to={`/residences/${item.slug}`} className="block font-display text-lg font-semibold leading-tight hover:text-primary">
          {item.nom_fr}
        </Link>
        {(item.ville || item.region) && (
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {[item.ville, item.region].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pt-6 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border/40">
      <td className="py-3 align-top text-sm font-medium text-muted-foreground">{label}</td>
      {children.map((c, i) => (
        <td key={i} className="py-3 align-top">{c}</td>
      ))}
    </tr>
  );
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-5 w-5 text-primary" aria-label="Oui" />
  ) : (
    <X className="h-5 w-5 text-muted-foreground/40" aria-label="Non" />
  );
}
