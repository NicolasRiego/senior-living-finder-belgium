import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "partner_member" | "caregiver";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: Role[];
  orgIds: string[];
  isAdmin: boolean;
  hasOrg: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgIds, setOrgIds] = useState<string[]>([]);

  const loadAccess = async (uid: string | null) => {
    if (!uid) {
      setRoles([]);
      setOrgIds([]);
      return;
    }
    const [{ data: roleRows }, { data: orgRows }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("org_members").select("org_id").eq("user_id", uid),
    ]);
    setRoles((roleRows ?? []).map((r) => r.role as Role));
    setOrgIds((orgRows ?? []).map((r) => r.org_id as string));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // defer to avoid deadlock
      setTimeout(() => loadAccess(s?.user?.id ?? null), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadAccess(session?.user?.id ?? null).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    orgIds,
    isAdmin: roles.includes("admin"),
    hasOrg: orgIds.length > 0,
    refresh: () => loadAccess(session?.user?.id ?? null),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
