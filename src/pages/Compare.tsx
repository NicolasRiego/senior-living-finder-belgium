import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Check, MapPin, GitCompare, Mail, Phone, Share2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useCompare } from "@/modules/compare/CompareProvider";
import {
  fetchCompareItems,
  fetchServicesLabels,
  fetchActivitiesLabels,
  type CompareItem,
} from "@/modules/residences/compareApi";
import { fetchCompareApartments } from "@/modules/apartments/compareApartmentsApi";

const TYPE_LABEL_KEY = (t: string) => `residenceTypes.${t}`;

export default function ComparePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { ids, remove, clear, setIds, aptIds, removeApt, clearApt } = useCompare();
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

  const aptQuery = useQuery({
    queryKey: ["compare-apartments", aptIds],
    queryFn: () => fetchCompareApartments(aptIds),
    enabled: aptIds.length > 0,
  });

  const items = query.data ?? [];
  const aptItems = aptQuery.data ?? [];

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

  if (ids.length === 0 && aptIds.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <GitCompare className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold">{t("compare.title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("compare.empty")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/residences">Comparer des résidences</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/appartements">Comparer des appartements</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = (ids.length > 0 && query.isLoading) || (aptIds.length > 0 && aptQuery.isLoading);
  if (isLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="container py-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Comparateur</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Comparez des résidences et des logements côte à côte
          </p>
        </div>
        <Button variant="outline" onClick={share}>
          <Share2 className="h-4 w-4" /> Partager
        </Button>
      </div>

      {/* ═══ SECTION RÉSIDENCES ═══ */}
      <div className="mb-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Comparateur de résidences</h2>
            <p className="mt-1 text-muted-foreground">
              {ids.length} résidence{ids.length > 1 ? "s" : ""} sélectionnée
              {ids.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {ids.length < 4 && (
              <Button asChild variant="outline" size="sm">
                <Link to="/residences">
                  <Plus className="h-4 w-4" /> Ajouter
                </Link>
              </Button>
            )}
            {ids.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Vider
              </Button>
            )}
          </div>
        </div>

        {ids.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
            <p className="mb-3">Aucune résidence dans le comparateur.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/residences">Parcourir les résidences</Link>
            </Button>
          </div>
        ) : (
          <>
            {items.length < 2 && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Sélectionnez au moins 2 résidences pour activer la comparaison complète.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-separate border-spacing-x-4">
                <thead>
                  <tr>
                    <th className="w-48 pb-2 text-left align-bottom text-sm font-semibold text-muted-foreground">
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
                    {items.map((r) => (
                      <span key={r.id}>{t(TYPE_LABEL_KEY(r.type_etablissement))}</span>
                    ))}
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
          </>
        )}
      </div>

      <hr className="my-8 border-border/60" />

      {/* ═══ SECTION APPARTEMENTS ═══ */}
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Comparateur de logements</h2>
            <p className="mt-1 text-muted-foreground">
              {aptIds.length} logement{aptIds.length > 1 ? "s" : ""} sélectionné
              {aptIds.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {aptIds.length < 4 && (
              <Button asChild variant="outline" size="sm">
                <Link to="/appartements">
                  <Plus className="h-4 w-4" /> Ajouter
                </Link>
              </Button>
            )}
            {aptIds.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearApt}>
                Vider
              </Button>
            )}
          </div>
        </div>

        {aptIds.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
            <p className="mb-3">Aucun logement dans le comparateur.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/appartements">Parcourir les appartements</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-x-4">
              <thead>
                <tr>
                  <th className="w-48 pb-2 text-left align-bottom text-sm font-semibold text-muted-foreground">
                    Critère
                  </th>
                  {aptItems.map((a) => (
                    <th key={a.id} className="text-left align-bottom">
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft min-w-[200px]">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-display text-base font-semibold leading-tight capitalize">
                                {a.type === "appartement"
                                  ? "Appartement"
                                  : a.type === "studio"
                                  ? "Studio"
                                  : a.type === "chambre"
                                  ? "Chambre"
                                  : a.type}
                              </p>
                              <Link
                                to={`/residences/${a.residence_slug}`}
                                className="mt-0.5 block text-sm text-muted-foreground hover:text-primary"
                              >
                                {a.residence_nom_fr}
                              </Link>
                              <p className="text-xs text-muted-foreground">{a.residence_ville}</p>
                            </div>
                            <button
                              onClick={() => removeApt(a.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="Retirer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-base">
                <SectionHeader label="Identification" colSpan={aptItems.length + 1} />
                <Row label="Type">
                  {aptItems.map((a) => <span key={a.id} className="capitalize">{a.type}</span>)}
                </Row>
                <Row label="Résidence">
                  {aptItems.map((a) => (
                    <Link key={a.id} to={`/residences/${a.residence_slug}`} className="text-sm text-primary hover:underline">
                      {a.residence_nom_fr}
                    </Link>
                  ))}
                </Row>
                <Row label="Ville">
                  {aptItems.map((a) => <span key={a.id}>{a.residence_ville || "—"}</span>)}
                </Row>

                <SectionHeader label="Surface & disposition" colSpan={aptItems.length + 1} />
                <Row label="Surface">
                  {aptItems.map((a) => <span key={a.id}>{a.surface_m2 ? `${a.surface_m2} m²` : "—"}</span>)}
                </Row>
                <Row label="Étage">
                  {aptItems.map((a) => (
                    <span key={a.id}>
                      {a.floor === 0 ? "Rez-de-chaussée" : a.floor != null ? `${a.floor}e étage` : "—"}
                    </span>
                  ))}
                </Row>

                <SectionHeader label="Transaction & prix" colSpan={aptItems.length + 1} />
                <Row label="Type de transaction">
                  {aptItems.map((a) => (
                    <span key={a.id}>
                      {a.transaction_type === "rent" ? "À louer" : a.transaction_type === "sale" ? "À vendre" : "Les deux"}
                    </span>
                  ))}
                </Row>
                <Row label="Loyer mensuel">
                  {aptItems.map((a) => (
                    <span key={a.id} className="font-semibold text-primary">
                      {a.rent_price ? `${a.rent_price.toLocaleString("fr-BE")} €/mois` : "—"}
                    </span>
                  ))}
                </Row>
                <Row label="Charges mensuelles">
                  {aptItems.map((a) => (
                    <span key={a.id}>
                      {a.charges_monthly ? `${a.charges_monthly.toLocaleString("fr-BE")} €` : "—"}
                    </span>
                  ))}
                </Row>
                <Row label="Prix d'achat">
                  {aptItems.map((a) => (
                    <span key={a.id} className="font-semibold">
                      {a.sale_price ? `${a.sale_price.toLocaleString("fr-BE")} €` : "—"}
                    </span>
                  ))}
                </Row>

                <SectionHeader label="Équipements" colSpan={aptItems.length + 1} />
                <Row label="Parking">{aptItems.map((a) => <BoolCell key={a.id} value={a.parking} />)}</Row>
                <Row label="Cave">{aptItems.map((a) => <BoolCell key={a.id} value={a.cave} />)}</Row>
                <Row label="Terrasse">{aptItems.map((a) => <BoolCell key={a.id} value={a.terrace} />)}</Row>
                <Row label="Jardin">{aptItems.map((a) => <BoolCell key={a.id} value={a.garden} />)}</Row>
                <Row label="Meublé">{aptItems.map((a) => <BoolCell key={a.id} value={a.furnished} />)}</Row>
                <Row label="Cuisine équipée">{aptItems.map((a) => <BoolCell key={a.id} value={a.kitchen_equipped} />)}</Row>
                <Row label="Ascenseur">{aptItems.map((a) => <BoolCell key={a.id} value={a.elevator} />)}</Row>
                <Row label="Accessible PMR">{aptItems.map((a) => <BoolCell key={a.id} value={a.wheelchair_accessible} />)}</Row>

                <SectionHeader label="Disponibilité" colSpan={aptItems.length + 1} />
                <Row label="Statut">
                  {aptItems.map((a) => (
                    <span key={a.id}>
                      {a.status === "available" ? "✓ Disponible" : a.status === "reserved" ? "Réservé" : "Indisponible"}
                    </span>
                  ))}
                </Row>
                <Row label="Disponible à partir du">
                  {aptItems.map((a) => (
                    <span key={a.id}>
                      {a.available_from ? new Date(a.available_from).toLocaleDateString("fr-BE") : "Immédiatement"}
                    </span>
                  ))}
                </Row>

                <SectionHeader label="Actions" colSpan={aptItems.length + 1} />
                <tr>
                  <td className="py-4 text-sm font-medium text-muted-foreground">Voir la fiche</td>
                  {aptItems.map((a) => (
                    <td key={a.id} className="py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="hero">
                          <Link to={`/appartements/${a.id}`}>Voir l'appartement</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/residences/${a.residence_slug}`}>Voir la résidence</Link>
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
