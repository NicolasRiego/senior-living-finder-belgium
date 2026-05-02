import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";

// Login is a stub for v1 — auth (email + magic link) lives in next iteration.
export default function LoginPage() {
  const { t } = useI18n();
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-10 shadow-elegant">
        <h1 className="font-display text-3xl font-semibold">{t("nav.login")}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          L'espace partenaire et famille arrive très bientôt.
        </p>
        <Button variant="outline" size="lg" className="mt-6 w-full" disabled>
          <Mail /> Continuer par e-mail
        </Button>
        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link to="/">{t("common.backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
