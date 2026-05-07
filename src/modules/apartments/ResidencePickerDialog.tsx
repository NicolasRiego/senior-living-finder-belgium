import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Plus, Search, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCoverUrl,
  listApartmentResidences,
  type ResidenceFacet,
} from "@/modules/apartments/publicApi";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appliedIds: string[];
  onApply: (ids: string[]) => void;
};

function CardCover({ path }: { path: string | null }) {
  const { data } = useQuery({
    queryKey: ["cover-url", path],
    queryFn: () => getCoverUrl(path),
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
  });
  if (!path || !data) {
    return <div className="aspect-[4/3] w-full bg-muted" aria-hidden />;
  }
  return (
    <img
      src={data}
      alt=""
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
    />
  );
}

const TYPE_LABELS: Record<string, string> = {
  services: "Services",
  seigneurie: "Seigneurie",
  repos: "Repos",
  repos_soins: "Repos & soins",
};

export function ResidencePickerDialog({ open, onOpenChange, appliedIds, onApply }: Props) {
  const residencesQ = useQuery({
    queryKey: ["residences-for-apartment-filter"],
    queryFn: listApartmentResidences,
    staleTime: 5 * 60 * 1000,
  });

  // Service code -> label map
  const servicesQ = useQuery({
    queryKey: ["services-catalog-codes"],
    queryFn: async () => {
      const { data } = await supabase.from("services_catalog").select("code, label_fr");
      const m = new Map<string, string>();
      for (const s of (data ?? []) as { code: string; label_fr: string }[]) {
        m.set(s.code, s.label_fr);
      }
      return m;
    },
    staleTime: 60 * 60 * 1000,
  });

  const [tempIds, setTempIds] = useState<string[]>(appliedIds);
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset temp selection when popup opens
  useEffect(() => {
    if (open) {
      setTempIds(appliedIds);
      setSearch("");
      setHighlightId(null);
    }
  }, [open, appliedIds]);

  const all = residencesQ.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (r) => r.nom_fr.toLowerCase().includes(q) || (r.ville ?? "").toLowerCase().includes(q),
    );
  }, [all, search]);

  const toggle = (id: string) => {
    setTempIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const focusCard = (id: string) => {
    setHighlightId(id);
    const el = cardRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1000);
  };

  const onLineClick = (id: string) => {
    toggle(id);
    focusCard(id);
  };

  const selectAll = () => setTempIds(filtered.map((r) => r.id));
  const clearAll = () => setTempIds([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label="Choisir des résidences"
        className="flex h-[80vh] max-h-[80vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl max-sm:h-screen max-sm:max-h-screen max-sm:max-w-full max-sm:rounded-none"
      >
        <header className="border-b border-border bg-card px-6 py-4">
          <DialogTitle className="font-display text-xl">Choisir des résidences</DialogTitle>
          <DialogDescription>
            {tempIds.length} résidence{tempIds.length > 1 ? "s" : ""} sélectionnée
            {tempIds.length > 1 ? "s" : ""}
          </DialogDescription>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Left column: list */}
          <aside className="flex shrink-0 flex-col gap-3 border-b border-border bg-muted/30 p-4 md:w-[300px] md:border-b-0 md:border-r">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, ville…"
                className="pl-9"
                aria-label="Rechercher une résidence"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background max-md:max-h-[200px]">
              {residencesQ.isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Aucune résidence</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((r) => {
                    const checked = tempIds.includes(r.id);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => onLineClick(r.id)}
                          className={cn(
                            "flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-muted",
                            checked && "bg-primary/5",
                          )}
                        >
                          <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{r.nom_fr}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[r.ville, r.region].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={selectAll}>
                Tout sélectionner
              </Button>
              <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={clearAll}>
                Tout effacer
              </Button>
            </div>
          </aside>

          {/* Right column: cards */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4">
            {residencesQ.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[340px] rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune résidence à afficher.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((r) => (
                  <ResidencePickerCard
                    key={r.id}
                    ref={(el) => {
                      cardRefs.current[r.id] = el;
                    }}
                    residence={r}
                    selected={tempIds.includes(r.id)}
                    highlighted={highlightId === r.id}
                    onToggle={() => toggle(r.id)}
                    serviceLabels={servicesQ.data}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={tempIds.length === 0}
            onClick={() => {
              onApply(tempIds);
              onOpenChange(false);
            }}
          >
            {tempIds.length === 0
              ? "Appliquer la sélection"
              : `Appliquer la sélection (${tempIds.length})`}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

import { forwardRef } from "react";

type CardProps = {
  residence: ResidenceFacet;
  selected: boolean;
  highlighted: boolean;
  onToggle: () => void;
  serviceLabels?: Map<string, string>;
};

const ResidencePickerCard = forwardRef<HTMLDivElement, CardProps>(
  ({ residence: r, selected, highlighted, onToggle, serviceLabels }, ref) => {
    const services = (r.included_service_codes ?? []).slice(0, 3);
    return (
      <div
        ref={ref}
        className={cn(
          "group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant",
          selected ? "border-primary" : "border-border/60",
          highlighted && "ring-2 ring-primary",
        )}
      >
        <div className="relative">
          <CardCover path={r.cover_path} />
          {r.type_etablissement && (
            <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium shadow-soft">
              {TYPE_LABELS[r.type_etablissement] ?? r.type_etablissement}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display text-base font-semibold leading-tight">{r.nom_fr}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {[r.ville, r.region].filter(Boolean).join(" · ") || "—"}
            </span>
          </div>

          <dl className="mt-1 space-y-1 text-xs text-muted-foreground">
            {r.capacity != null && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Capacité : {r.capacity} logements</span>
              </div>
            )}
            {r.price_from != null && (
              <div>À partir de {Number(r.price_from).toLocaleString("fr-BE")} €/mois</div>
            )}
          </dl>

          {services.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {services.map((code) => (
                <Badge key={code} variant="secondary" className="font-normal">
                  {serviceLabels?.get(code) ?? code}
                </Badge>
              ))}
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={onToggle}
            className={cn("mt-auto w-full", !selected && "border-primary text-primary hover:bg-primary/5")}
            aria-pressed={selected}
          >
            {selected ? (
              <>
                <Check className="mr-1.5 h-4 w-4" /> Sélectionnée
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter au filtre
              </>
            )}
          </Button>
        </div>
      </div>
    );
  },
);
ResidencePickerCard.displayName = "ResidencePickerCard";
