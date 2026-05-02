import { Link } from "react-router-dom";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function MaintenancePage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <Home className="h-10 w-10" />
        </div>
        <h1 className="font-display text-4xl font-semibold text-balance">{t("maintenance.title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("maintenance.body")}</p>
        <Button asChild variant="outline" size="lg" className="mt-8">
          <Link to="/"><ArrowLeft /> {t("common.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
