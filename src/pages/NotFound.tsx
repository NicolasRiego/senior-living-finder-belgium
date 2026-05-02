import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";

const NotFound = () => {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20 text-center">
      <div className="max-w-md">
        <p className="font-display text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">{t("notFound.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("notFound.body")}</p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/">{t("common.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
