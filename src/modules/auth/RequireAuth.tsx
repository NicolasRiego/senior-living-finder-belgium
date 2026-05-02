import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

type Props = {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOrg?: boolean;
};

export function RequireAuth({ children, requireAdmin, requireOrg }: Props) {
  const { loading, user, isAdmin, hasOrg } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/connexion?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireOrg && !hasOrg && !isAdmin) {
    return <Navigate to="/partenaire/onboarding" replace />;
  }

  return <>{children}</>;
}
