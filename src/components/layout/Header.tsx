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
    <header data-fixed-size="true" className="sticky top-0 z-50 w-full max-w-[100vw] [overflow-x:clip] border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex min-h-24 w-full max-w-[1400px] flex-nowrap items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-display text-2xl font-semibold whitespace-nowrap">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
            <Heart className="h-6 w-6" fill="currentColor" />
          </span>
          <span>{t("brand.name")}</span>
        </Link>

        <nav className="hidden shrink-0 flex-nowrap items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-full px-4 py-2.5 text-lg font-medium leading-none transition-colors",
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

        <div className="hidden shrink-0 flex-nowrap items-center gap-2 lg:flex">
          <LocaleSwitcher />
          <FontSizeControls />
          {user ? (
            <>
              <Button asChild variant="outline" size="sm" className="h-10 whitespace-nowrap px-4 text-base">
                <Link to={myLink}><User className="h-5 w-5 mr-1.5" /> {myLabel}</Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={signOut} aria-label="Se déconnecter">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-10 whitespace-nowrap px-4 text-base">
                <Link to="/connexion">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="h-10 whitespace-nowrap px-4 text-base">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background lg:hidden">
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
