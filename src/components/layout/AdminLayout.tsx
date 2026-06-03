import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  LogOut,
  Home,
  ListChecks,
  Users,
  ScrollText,
  Rocket,
  Database,
  Ticket,
  FolderKanban,
  Cog,
  Building2,
  User as UserIcon,
  Briefcase,
  LayoutDashboard,
  Contact,
  Kanban,
  Megaphone,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { ConstructionBanner } from "./ConstructionBanner";
import { AdminDropdown, AdminDropdownItem } from "./admin/AdminDropdown";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const go = (path: string, close: () => void) => () => {
    close();
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <ConstructionBanner />
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 font-display text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Admin</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <AdminDropdown label="Contenu" icon={<FolderKanban className="h-4 w-4" />}>
                {(close) => (
                  <>
                    <AdminDropdownItem onSelect={go("/admin/validation", close)} icon={<ListChecks className="h-4 w-4" />}>
                      Validation
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/residences", close)} icon={<ShieldCheck className="h-4 w-4" />}>
                      Résidences
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/utilisateurs", close)} icon={<Users className="h-4 w-4" />}>
                      Utilisateurs
                    </AdminDropdownItem>
                  </>
                )}
              </AdminDropdown>
              <AdminDropdown label="Système" icon={<Cog className="h-4 w-4" />}>
                {(close) => (
                  <>
                    <AdminDropdownItem onSelect={go("/admin/audit", close)} icon={<ScrollText className="h-4 w-4" />}>
                      Journal
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/deploiements", close)} icon={<Rocket className="h-4 w-4" />}>
                      Déploiements
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/demo", close)} icon={<Database className="h-4 w-4" />}>
                      Démo
                    </AdminDropdownItem>
                  </>
                )}
              </AdminDropdown>
              <AdminDropdown label="Commercial" icon={<Briefcase className="h-4 w-4" />}>
                {(close) => (
                  <>
                    <AdminDropdownItem onSelect={go("/admin/crm", close)} icon={<LayoutDashboard className="h-4 w-4" />}>
                      Tableau de bord
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/crm/contacts", close)} icon={<Contact className="h-4 w-4" />}>
                      Contacts & Groupes
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/crm/pipeline", close)} icon={<Kanban className="h-4 w-4" />}>
                      Pipeline
                    </AdminDropdownItem>
                    <AdminDropdownItem onSelect={go("/admin/crm/campagnes", close)} icon={<Megaphone className="h-4 w-4" />}>
                      Campagnes
                    </AdminDropdownItem>
                  </>
                )}
              </AdminDropdown>
              <Link
                to="/admin/tickets"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Ticket className="h-4 w-4" /> Tickets
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Home className="h-4 w-4" /> Site public
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <AdminDropdown label="Mon espace" icon={<UserIcon className="h-4 w-4" />} align="right">
              {(close) => (
                <>
                  <AdminDropdownItem onSelect={go("/partenaire", close)} icon={<Building2 className="h-4 w-4" />}>
                    Espace partenaire
                  </AdminDropdownItem>
                  <AdminDropdownItem onSelect={go("/mon-espace", close)} icon={<UserIcon className="h-4 w-4" />}>
                    Espace utilisateur
                  </AdminDropdownItem>
                </>
              )}
            </AdminDropdown>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t flex overflow-x-auto">
          {[
            { to: "/admin/validation", label: "Validation", icon: ListChecks },
            { to: "/admin/residences", label: "Résidences", icon: ShieldCheck },
            { to: "/admin/utilisateurs", label: "Users", icon: Users },
            { to: "/admin/tickets", label: "Tickets", icon: Ticket },
            { to: "/admin/audit", label: "Journal", icon: ScrollText },
          ].map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs whitespace-nowrap px-2"
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container py-8">{children}</main>
      <footer className="border-t bg-card/50 py-4 text-center text-xs text-muted-foreground">
        Version <span className="font-mono">{APP_VERSION}</span>
      </footer>
    </div>
  );
}
