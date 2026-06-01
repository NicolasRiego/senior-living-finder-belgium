import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getResidenceFullById } from "@/modules/residences/publicApi";
import ResidenceDetailView, { type ResidenceDetailData } from "@/modules/residences/ResidenceDetailView";

export default function ResidencePreview() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["residence-preview", id],
    queryFn: () => getResidenceFullById(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="container py-12">Chargement…</div>;
  if (!data) return <div className="container py-12">Résidence introuvable.</div>;

  const banner = (
    <div className="bg-amber-50 border-b border-amber-200 py-3 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <p className="text-amber-900">
          👁 Aperçu privé — cette fiche n'est pas encore publiée
        </p>
        <Button variant="outline" asChild>
          <Link to={`/partenaire/residences/${id}/edition`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'édition
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <ResidenceDetailView
      data={data as ResidenceDetailData}
      topBanner={banner}
      backLink={{ to: `/partenaire/residences/${id}/edition`, label: "Retour à l'édition" }}
      disableCompare
    />
  );
}
