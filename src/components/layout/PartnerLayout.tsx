import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { Building2, LayoutDashboard, Users, LogOut, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/AuthProvider";

const navItems = [
  { to: "/partenaire", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/partenaire/residences", label: "Mes résidences", icon: Building2, end: false },
  { to: "/partenaire/equipe", label: "Équipe", icon: Users, end: false },
];

export function PartnerLayout({ children }: { children: ReactNode }) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/partenaire" className="font-display text-2xl">
            SereniaCare <span className="text-base text-muted-foreground">· Espace partenaire</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/" target="_blank" rel="noopener">
                <Eye className="h-4 w-4 mr-2" /> Voir le site
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin/validation">Admin</Link>
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
            {navItems.map((item) => (
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
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
