import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Heart, User, LogOut, ChevronDown } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { FontSizeControls } from "@/modules/accessibility/FontSizeControls";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <div className="mx-auto flex min-h-[84px] w-full max-w-[1400px] flex-nowrap items-center justify-between gap-2 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-1.5 font-display text-[1.31rem] font-semibold whitespace-nowrap">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
            <Heart className="h-[21px] w-[21px]" fill="currentColor" />
          </span>
          <span>{t("brand.name")}</span>
        </Link>

        <nav className="hidden shrink-0 flex-nowrap items-center gap-0.5 min-[1100px]:flex" aria-label="Primary">
          {links.map((l) => (
            <Fragment key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full px-[11px] py-[9px] text-[1.091rem] font-medium leading-none transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {l.label}
              </NavLink>
              {l.to === "/residences" && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[11px] py-[9px] text-[1.091rem] font-medium leading-none text-foreground/80 transition-colors hover:bg-muted hover:text-foreground">
                    Appartements <ChevronDown className="h-[15px] w-[15px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[240px]">
                    <DropdownMenuItem asChild>
                      <Link to="/appartements?type=vente" className="text-[18.5px]">Appartements à vendre</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/appartements?type=location" className="text-[18.5px]">Appartements à louer</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="hidden shrink-0 flex-nowrap items-center gap-2 min-[1100px]:flex">
          <LocaleSwitcher />
          <FontSizeControls />
          {user ? (
            <>
              <Button asChild variant="outline" size="sm" className="h-[34px] whitespace-nowrap px-[11px] py-[7px] text-[1.091rem]">
                <Link to={myLink} aria-label={myLabel}>
                  <User className="h-[17px] w-[17px] mr-1.5" />
                  <span className="hidden xl:inline">{myLabel}</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-[34px] w-[34px]" onClick={signOut} aria-label="Se déconnecter">
                <LogOut className="h-[17px] w-[17px]" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-[34px] whitespace-nowrap px-[11px] text-[1.091rem]">
                <Link to="/connexion">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="h-[34px] whitespace-nowrap px-[11px] text-[1.091rem]">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted min-[1100px]:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background min-[1100px]:hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {links.map((l) => (
              <Fragment key={l.to}>
                <NavLink
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
                {l.to === "/residences" && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Appartements
                    </div>
                    <NavLink
                      to="/appartements?type=vente"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-8 py-2.5 text-base font-medium text-foreground/85 hover:bg-muted"
                    >
                      → À vendre
                    </NavLink>
                    <NavLink
                      to="/appartements?type=location"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-8 py-2.5 text-base font-medium text-foreground/85 hover:bg-muted"
                    >
                      → À louer
                    </NavLink>
                  </>
                )}
              </Fragment>
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
