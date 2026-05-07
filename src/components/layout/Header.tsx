import { Link, NavLink } from "react-router-dom";
import { Menu, X, Heart, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { FontSizeControls } from "@/modules/accessibility/FontSizeControls";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/AuthProvider";

export function Header() {
  const { t } = useI18n();
  const { user, isPartner, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const myLink = isPartner ? "/partenaire" : "/mon-espace";
  const myLabel = isPartner ? "Espace partenaire" : "Mon espace";

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/residences", label: t("nav.residences") },
    { to: "/comparateur", label: t("nav.compare") },
    { to: "/conseils", label: t("nav.advice") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header data-fixed-size="true" className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-hidden border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="container flex min-h-20 flex-wrap items-center justify-between gap-3 py-2">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold whitespace-nowrap">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
            <Heart className="h-4 w-4" fill="currentColor" />
          </span>
          <span>{t("brand.name")}</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-base font-medium transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <LocaleSwitcher />
          <FontSizeControls />
          {user ? (
            <>
              <Button asChild variant="outline" className="whitespace-nowrap">
                <Link to={myLink}><User className="h-4 w-4 mr-2" /> {myLabel}</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="whitespace-nowrap">
                <Link to="/connexion">{t("nav.login")}</Link>
              </Button>
              <Button asChild className="whitespace-nowrap">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted xl:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background xl:hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-4 py-3 text-lg font-medium",
                    isActive ? "bg-primary-soft text-primary" : "text-foreground/85 hover:bg-muted",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-2">
              <div className="flex items-center justify-between gap-2">
                <LocaleSwitcher />
                <FontSizeControls />
              </div>
              {user ? (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={myLink} onClick={() => setOpen(false)}>{myLabel}</Link>
                  </Button>
                  <Button variant="ghost" onClick={() => { signOut(); setOpen(false); }}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/connexion" onClick={() => setOpen(false)}>{t("nav.login")}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/inscription" onClick={() => setOpen(false)}>Créer un compte</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
