import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Maximize, Trash2, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoverUrl } from "./publicApi";
import { useSavedApartments, type SavedApartment } from "./savedApartments";

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  chambre: "Chambre",
  studio: "Studio",
};

export function SavedApartmentsList({
  onSimulate,
}: {
  onSimulate?: (id: string) => void;
}) {
  const { items, remove } = useSavedApartments();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-base">Vous n'avez pas encore enregistré d'appartement.</p>
          <p className="text-sm text-muted-foreground">
            Parcourez les annonces et cliquez sur « Enregistrer » pour les retrouver ici.
          </p>
          <Button asChild>
            <Link to="/appartements">Découvrir les appartements</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((a) => (
        <SavedRow key={a.id} apt={a} onRemove={() => remove(a.id)} onSimulate={onSimulate} />
      ))}
    </div>
  );
}

function SavedRow({
  apt, onRemove, onSimulate,
}: {
  apt: SavedApartment;
  onRemove: () => void;
  onSimulate?: (id: string) => void;
}) {
  const [cover, setCover] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const FALLBACK =
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";
    if (apt.cover_path) {
      getCoverUrl(apt.cover_path).then((u) => { if (active) setCover(u ?? FALLBACK); });
    } else {
      if (active) setCover(FALLBACK);
    }
    return () => { active = false; };
  }, [apt.cover_path]);

  const price = apt.rent_price
    ? `${apt.rent_price.toLocaleString("fr-BE")} €/mois`
    : apt.sale_price
    ? `${apt.sale_price.toLocaleString("fr-BE")} €`
    : "Prix sur demande";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative h-40 w-full sm:h-auto sm:w-40 shrink-0 bg-muted">
          {cover ? (
            <img src={cover} alt={apt.residence_nom_fr} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800"; }} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Building2 className="h-8 w-8" />
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
          <div className="space-y-1 min-w-0">
            <h3 className="font-display text-lg font-semibold leading-tight break-words">
              {apt.residence_nom_fr}
            </h3>
            <p className="text-sm text-muted-foreground break-words">
              {[apt.type ? (TYPE_LABEL[apt.type] ?? apt.type) : null, apt.surface_m2 ? `${apt.surface_m2} m²` : null, apt.ville]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="font-display text-base font-semibold text-primary">{price}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onSimulate && (
              <Button size="sm" variant="default" onClick={() => onSimulate(apt.id)}>
                <Calculator className="h-4 w-4" /> Simuler
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link to={`/appartements/${apt.id}`}>
                <Maximize className="h-4 w-4" /> Voir l'appartement
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/residences/${apt.residence_slug}`}>
                <Building2 className="h-4 w-4" /> Voir la résidence
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              aria-label="Retirer cet appartement"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
