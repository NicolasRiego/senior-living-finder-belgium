import { ReactNode, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Building2, LayoutDashboard, Users, LogOut, Eye, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { SpaceSwitcher } from "./SpaceSwitcher";

const navItems = [
  { to: "/partenaire", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/partenaire/residences", label: "Mes résidences", icon: Building2, end: false },
  { to: "/partenaire/leads", label: "Leads", icon: Inbox, end: false },
  { to: "/partenaire/equipe", label: "Équipe", icon: Users, end: false },
  { to: "/partenaire/corbeille", label: "Corbeille", icon: Trash2, end: false },
];

export function PartnerLayout({ children }: { children: ReactNode }) {
  const { user, signOut, isAdmin, orgIds } = useAuth();
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    if (!orgIds.length) {
      setTrashCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("residences")
        .select("id", { count: "exact", head: true })
        .in("org_id", orgIds)
        .eq("status", "archived");
      if (!cancelled) setTrashCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgIds.join(",")]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/partenaire" className="font-display text-2xl">
            House of Living <span className="text-base text-muted-foreground">· Espace partenaire</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/" target="_blank" rel="noopener">
                <Eye className="h-4 w-4 mr-2" /> Voir le site
              </Link>
            </Button>
            {isAdmin ? (
              <SpaceSwitcher />
            ) : (
              <Button variant="ghost" asChild>
                <Link to="/" target="_blank" rel="noopener">
                  <Eye className="h-4 w-4 mr-2" /> Voir le site
                </Link>
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const showBadge = item.to === "/partenaire/corbeille" && trashCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span
                      className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold min-w-[1.25rem] h-5 px-1.5"
                      aria-label={`${trashCount} résidence${trashCount > 1 ? "s" : ""} dans la corbeille`}
                    >
                      {trashCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
