import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Heart, User, LogOut, ChevronDown } from "lucide-react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { SpaceSwitcher } from "./SpaceSwitcher";
import { useCompare } from "@/modules/compare/CompareProvider";

// Desktop bar keeps fixed sizes and spacing; when space runs out, items move
// into the ☰ menu in this order (first one goes first).
const HIDE_ORDER = ["font", "locale", "/contact", "/conseils", "/comparateur", "logements", "/residences", "/"];
const NAV_GAP = 2;
const GROUP_GAP = 8;
const DESKTOP_QUERY = "(min-width: 768px)";

export function Header() {
  const { t, locale } = useI18n();
  const { ids: compareIds, aptIds: compareAptIds } = useCompare();
  const compareCount = compareIds.length + compareAptIds.length;
  const { user, isPartner, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches);
  const [measuring, setMeasuring] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const barRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const burgerWidth = useRef(0);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const widths = useRef<Record<string, number>>({});
  const setItemRef = (key: string) => (el: HTMLElement | null) => { itemRefs.current[key] = el; };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const fit = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const cs = getComputedStyle(bar);
    const avail = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const fixed = (logoRef.current?.offsetWidth ?? 0) + (accountRef.current?.offsetWidth ?? 0) + 2 * GROUP_GAP;
    const w = widths.current;
    const gap = (k: string) => (k === "font" || k === "locale" ? GROUP_GAP : NAV_GAP);
    const visible = HIDE_ORDER.filter((k) => w[k] != null);
    const need = () => visible.reduce((sum, k) => sum + w[k] + gap(k), 0);
    const next = new Set<string>();
    if (fixed + need() > avail) {
      for (const k of HIDE_ORDER) {
        if (fixed + burgerWidth.current + GROUP_GAP + need() <= avail) break;
        const i = visible.indexOf(k);
        if (i >= 0) visible.splice(i, 1);
        next.add(k);
      }
    }
    setHidden((prev) => (prev.size === next.size && [...next].every((k) => prev.has(k)) ? prev : next));
  }, []);

  // Re-measure natural widths when the labels or the account buttons change.
  useEffect(() => { setMeasuring(true); }, [locale, user?.id, isAdmin, isPartner, desktop, compareCount]);

  // Web fonts load after the first paint and change every width.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const remeasure = () => setMeasuring(true);
    fonts.ready.then(remeasure);
    fonts.addEventListener("loadingdone", remeasure);
    return () => fonts.removeEventListener("loadingdone", remeasure);
  }, []);

  useLayoutEffect(() => {
    if (!measuring) return;
    for (const [k, el] of Object.entries(itemRefs.current)) {
      if (el && el.offsetWidth) widths.current[k] = el.offsetWidth;
    }
    if (burgerRef.current?.offsetWidth) burgerWidth.current = burgerRef.current.offsetWidth;
    setMeasuring(false);
    fit();
  }, [measuring, fit]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(bar);
    return () => ro.disconnect();
  }, [fit]);

  const isHidden = (k: string) => !measuring && hidden.has(k);
  const showBurger = !desktop || measuring || hidden.size > 0;
  const inMenu = (k: string) => !desktop || hidden.has(k);

  useEffect(() => { if (!showBurger) setOpen(false); }, [showBurger]);

  const isTransparent = isHome && !scrolled && !open && !dropdownOpen;
  const myLink = isPartner ? "/partenaire" : "/mon-espace";
  const myLabel = isPartner ? "Espace partenaire" : "Mon espace";

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/residences", label: t("nav.residences") },
    { to: "/comparateur", label: compareCount ? `${t("nav.compare")} (${compareCount})` : t("nav.compare") },
    { to: "/conseils", label: t("nav.advice") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header
      data-fixed-size="true"
      className={cn(
        "sticky top-0 z-50 w-full max-w-[100vw] [overflow-x:clip] transition-all duration-300",
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "border-b border-border/50 bg-background/85 backdrop-blur-md",
      )}
    >
      <div ref={barRef} className="mx-auto flex min-h-[84px] w-full max-w-[1480px] flex-nowrap items-center justify-between gap-2 px-4">
        <Link
          ref={logoRef}
          to="/"
          className={cn(
            "flex shrink-0 items-center gap-1.5 font-display text-[1.05rem] sm:text-[1.15rem] font-semibold whitespace-nowrap transition-colors",
            isTransparent ? "text-white drop-shadow" : "text-foreground",
          )}
        >
          <img src="/logo-mlh-rond-feuille.png" alt="" className="h-[52px] w-[52px] rounded-full bg-white shadow-soft" />
          <span>{t("brand.name")}</span>
        </Link>

        <nav className="hidden shrink-0 flex-nowrap items-center gap-0.5 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Fragment key={l.to}>
              <NavLink
                ref={setItemRef(l.to)}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    isHidden(l.to) && "hidden",
                    "shrink-0 whitespace-nowrap rounded-full px-[11px] py-[9px] text-[1.091rem] font-medium leading-none transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : isTransparent
                        ? "text-white/90 hover:bg-white/10 hover:text-white drop-shadow"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {l.label}
              </NavLink>
              {l.to === "/residences" && (
                <DropdownMenu modal={false} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger
                    ref={setItemRef("logements")}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-[11px] py-[9px] text-[1.091rem] font-medium leading-none transition-colors",
                      location.pathname.startsWith("/appartements")
                        ? "bg-primary-soft text-primary"
                        : isTransparent
                          ? "text-white/90 hover:bg-white/10 hover:text-white drop-shadow"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      isHidden("logements") && "hidden",
                    )}
                  >
                    Logements <ChevronDown className="h-[15px] w-[15px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[240px]">
                    <DropdownMenuItem asChild>
                      <Link to="/appartements?type=vente" className="text-[18.5px]">Logements à vendre</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/appartements?type=location" className="text-[18.5px]">Logements à louer</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Fragment>
          ))}
        </nav>

        <div
          className={cn(
            "hidden shrink-0 flex-nowrap items-center gap-2 md:flex",
            isTransparent &&
              "[&_[role=group]]:!border-white/40 [&_[role=group]]:!bg-white/10 [&_[role=group]]:!backdrop-blur-sm [&_[role=group]_button]:!text-white",
          )}
        >
          <div ref={setItemRef("locale")} className={cn("shrink-0", isHidden("locale") && "hidden")}>
            <LocaleSwitcher />
          </div>
          <div ref={setItemRef("font")} className={cn("shrink-0", isHidden("font") && "hidden")}>
            <FontSizeControls />
          </div>
          <div ref={accountRef} className="flex shrink-0 flex-nowrap items-center gap-2">
          {user ? (
            <>
              {isAdmin ? (
                <SpaceSwitcher
                  variant={isTransparent ? "outline" : "outline"}
                  onOpenChange={setDropdownOpen}
                  triggerClassName={cn(
                    "h-[34px] text-[1.091rem]",
                    isTransparent && "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm",
                  )}
                />
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-[34px] whitespace-nowrap px-[11px] py-[7px] text-[1.091rem]",
                    isTransparent && "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm",
                  )}
                >
                  <Link to={myLink} aria-label={myLabel}>
                    <User className="h-[17px] w-[17px] mr-1.5" />
                    <span className="hidden xl:inline">{myLabel}</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-[34px] w-[34px]", isTransparent && "text-white hover:bg-white/15 hover:text-white")}
                onClick={signOut}
                aria-label="Se déconnecter"
              >
                <LogOut className="h-[17px] w-[17px]" />
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "h-[34px] whitespace-nowrap px-[11px] text-[1.091rem]",
                  isTransparent && "text-white hover:bg-white/15 hover:text-white",
                )}
              >
                <Link to="/connexion">{t("nav.login")}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-[34px] whitespace-nowrap px-[11px] text-[1.091rem]",
                  isTransparent && "bg-white text-primary hover:bg-white/90",
                )}
              >
                <Link to="/inscription">S'inscrire</Link>
              </Button>
            </>
          )}
          </div>
        </div>

        <button
          ref={burgerRef}
          className={cn(
            "h-12 w-12 shrink-0 items-center justify-center rounded-full hover:bg-muted",
            showBurger ? "inline-flex" : "hidden",
            isTransparent ? "text-white hover:bg-white/15" : "text-foreground",
          )}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && showBurger && (
        <div className="border-t border-border/50 bg-background">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {links.map((l) => (
              <Fragment key={l.to}>
                {inMenu(l.to) && (
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
                )}
                {l.to === "/residences" && inMenu("logements") && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Logements
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
              {(inMenu("locale") || inMenu("font")) && (
                <div className="flex items-center justify-between gap-2">
                  {inMenu("locale") && <LocaleSwitcher />}
                  {inMenu("font") && <FontSizeControls />}
                </div>
              )}
              {desktop ? null : user ? (
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
                    <Link to="/inscription" onClick={() => setOpen(false)}>S'inscrire</Link>
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
