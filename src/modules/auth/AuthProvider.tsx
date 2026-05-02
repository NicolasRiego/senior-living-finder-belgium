import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "partner_member" | "caregiver";
type AccountType = "family" | "partner";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: Role[];
  orgIds: string[];
  accountType: AccountType | null;
  isAdmin: boolean;
  hasOrg: boolean;
  isPartner: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  const loadAccess = async (uid: string | null) => {
    if (!uid) {
      setRoles([]);
      setOrgIds([]);
      setAccountType(null);
      return;
    }
    const [{ data: roleRows }, { data: orgRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("org_members").select("org_id").eq("user_id", uid),
      supabase.from("profiles").select("account_type").eq("user_id", uid).maybeSingle(),
    ]);
    setRoles((roleRows ?? []).map((r) => r.role as Role));
    setOrgIds((orgRows ?? []).map((r) => r.org_id as string));
    setAccountType((profile?.account_type as AccountType) ?? "family");
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
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
    accountType,
    isAdmin: roles.includes("admin"),
    hasOrg: orgIds.length > 0,
    isPartner: accountType === "partner" || roles.includes("partner_member"),
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
