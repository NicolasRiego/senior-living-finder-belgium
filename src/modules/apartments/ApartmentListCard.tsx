import { Link } from "react-router-dom";
import { Pencil, Trash2, Pin, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ApartmentRow = {
  id: string;
  title_fr: string | null;
  type: "appartement" | "studio" | "chambre" | null;
  surface_m2: number | null;
  transaction_type: "sale" | "rent" | "both" | null;
  rent_price: number | null;
  sale_price: number | null;
  charges_monthly: number | null;
  status: string;
  is_pinned: boolean;
};

const typeLabel: Record<string, string> = {
  appartement: "Appartement",
  studio: "Studio",
  chambre: "Chambre",
};

const txLabel: Record<string, string> = {
  sale: "Vendre",
  rent: "Louer",
  both: "Les 2",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  available: { label: "Dispo", className: "bg-[#16a34a] text-white" },
  reserved: { label: "Réservé", className: "bg-amber-500 text-white" },
  unavailable: { label: "Indisponible", className: "bg-gray-700 text-white" },
};

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat("fr-BE").format(n) + " €" : "—";

type Props = {
  apartment: ApartmentRow;
  residenceId: string;
  onTogglePin: (a: ApartmentRow) => void;
  onDelete: (a: ApartmentRow) => void;
};

export default function ApartmentListCard({ apartment: a, residenceId, onTogglePin, onDelete }: Props) {
  const sm = statusMeta[a.status] ?? statusMeta.available;
  const priceText = (() => {
    if (a.transaction_type === "rent" || a.transaction_type === "both") {
      return `${fmt(a.rent_price)}/mois`;
    }
    if (a.transaction_type === "sale") return fmt(a.sale_price);
    return null;
  })();

  return (
    <div
      className={`rounded-lg border bg-card p-3 hover:bg-muted/30 transition-colors ${
        a.is_pinned ? "border-l-4 border-l-[#16a34a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-base break-words min-w-0 flex-1">
          {a.title_fr || "Sans titre"}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            aria-label="Aperçu de l'appartement"
          >
            <a href={`/appartements/${a.id}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline whitespace-nowrap">Aperçu</span>
            </a>
          </Button>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${sm.className}`}
          >
            {sm.label}
          </span>
          <Button
            variant={a.is_pinned ? "default" : "outline"}
            size="sm"
            onClick={() => onTogglePin(a)}
            aria-label={a.is_pinned ? "Désépingler" : "Épingler"}
            className={a.is_pinned ? "bg-[#16a34a] hover:bg-[#15803d] text-white" : ""}
          >
            <Pin className={`h-4 w-4 ${a.is_pinned ? "fill-current" : ""}`} />
            <span className="ml-1 hidden sm:inline whitespace-nowrap">
              {a.is_pinned ? "Épinglé" : "Épingler"}
            </span>
          </Button>
          <Button variant="outline" size="sm" asChild aria-label="Modifier">
            <Link to={`/partenaire/residences/${residenceId}/appartements/${a.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(a)} aria-label="Supprimer">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <Badge variant="outline" className="whitespace-nowrap">
          {a.type ? typeLabel[a.type] : "—"}
        </Badge>
        <span aria-hidden>·</span>
        <span className="whitespace-nowrap">
          {a.surface_m2 != null ? `${a.surface_m2} m²` : "—"}
        </span>
        <span aria-hidden>·</span>
        <Badge variant="secondary" className="whitespace-nowrap">
          {a.transaction_type ? txLabel[a.transaction_type] : "—"}
        </Badge>
        {priceText && (
          <>
            <span aria-hidden>·</span>
            <span className="whitespace-nowrap">{priceText}</span>
          </>
        )}
      </div>
    </div>
  );
}
