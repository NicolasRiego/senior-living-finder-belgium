import { Link } from "react-router-dom";
import { Heart, Mail, MapPin } from "lucide-react";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { useAuth } from "@/modules/auth/AuthProvider";
import { APP_VERSION } from "@/lib/version";

export function Footer() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/40">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 font-display text-xl font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            {t("brand.name")}
          </div>
          <p className="mt-4 max-w-md text-base text-muted-foreground">{t("footer.tagline")}</p>
          <div className="mt-6 space-y-2 text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Bruxelles · Belgique
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> bonjour@sereniacare.be
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-base font-semibold">{t("footer.explore")}</h4>
          <ul className="space-y-3 text-muted-foreground">
            <li><Link to="/residences" className="hover:text-foreground">{t("nav.residences")}</Link></li>
            <li><Link to="/comparateur" className="hover:text-foreground">{t("nav.compare")}</Link></li>
            <li><Link to="/conseils" className="hover:text-foreground">{t("nav.advice")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-base font-semibold">{t("footer.company")}</h4>
          <ul className="space-y-3 text-muted-foreground">
            <li><Link to="/conseils" className="hover:text-foreground">{t("footer.aboutUs")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("footer.partners")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("footer.legal")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("footer.privacy")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted-foreground">
          <span>© {year} {t("brand.name")}. {t("footer.rights")}</span>
          {isAdmin && (
            <span className="font-mono text-xs">v{APP_VERSION}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
