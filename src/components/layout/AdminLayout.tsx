import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ListChecks, History, ScrollText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/validation", label: "Validation", icon: ListChecks },
  { to: "/admin/residences", label: "Résidences", icon: ShieldCheck },
  { to: "/admin/audit", label: "Journal", icon: ScrollText },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Link to="/admin/validation" className="flex items-center gap-2 font-display text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Admin
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t flex">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  isActive && "text-primary"
                )
              }
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
