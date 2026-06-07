import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { getResidenceFullBySlug } from "@/modules/residences/publicApi";
import { trackResidenceEvent } from "@/modules/analytics/track";
import ResidenceDetailView, { type ResidenceDetailData } from "@/modules/residences/ResidenceDetailView";

export default function ResidenceDetailPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["residence-detail", slug],
    queryFn: () => getResidenceFullBySlug(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.residence?.id) trackResidenceEvent(data.residence.id, "view");
  }, [data?.residence?.id]);

  if (isLoading) {
    return <div className="container py-24 text-center text-muted-foreground">Chargement…</div>;
  }
  if (!data) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("notFound.title")}</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/residences"><ArrowLeft /> {t("nav.residences")}</Link>
        </Button>
      </div>
    );
  }

  return <ResidenceDetailView data={data as ResidenceDetailData} backLink={{ to: "/residences", label: "Retour aux résidences" }} />;
}
