import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Crown, Search } from "lucide-react";

type UserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  account_type: string;
  is_super_admin: boolean;
  is_admin: boolean;
  is_partner: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

type Role = "admin" | "partner" | "user";

function roleOf(u: UserRow): Role {
  if (u.is_admin) return "admin";
  if (u.is_partner) return "partner";
  return "user";
}

function roleLabel(r: Role) {
  return r === "admin" ? "Administrateur" : r === "partner" ? "Partenaire" : "Utilisateur";
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ target: UserRow; newRole: Role } | null>(null);
  const [working, setWorking] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as UserRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (user?.id) {
      supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsSuper(Boolean(data?.is_super_admin)));
    }
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.display_name?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const confirmChange = async () => {
    if (!pending) return;
    setWorking(true);
    const { error } = await supabase.rpc("admin_set_user_role", {
      _target_user_id: pending.target.user_id,
      _role: pending.newRole,
    });
    setWorking(false);
    if (error) {
      toast({ title: "Échec", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rôle mis à jour" });
      setPending(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Gestion des utilisateurs
            <Badge variant="secondary" className="ml-2">{rows.length}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSuper
              ? "Vous êtes super administrateur — vous pouvez promouvoir d'autres administrateurs."
              : "Vous pouvez gérer les rôles partenaire / utilisateur. Seul le super administrateur peut promouvoir un administrateur."}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email ou nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Rechercher un utilisateur"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const role = roleOf(u);
                const isSelf = u.user_id === user?.id;
                return (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.is_super_admin && (
                          <Crown className="h-4 w-4 text-amber-500" aria-label="Super administrateur" />
                        )}
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>{u.display_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={role === "admin" ? "default" : role === "partner" ? "secondary" : "outline"}
                      >
                        {roleLabel(role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("fr-BE")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("fr-BE")
                        : "Jamais"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.is_super_admin || isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : role === "admin" ? (
                        isSuper && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPending({ target: u, newRole: "user" })}
                          >
                            Rétrograder
                          </Button>
                        )
                      ) : (
                        <>
                          {isSuper && (
                            <Button
                              size="sm"
                              onClick={() => setPending({ target: u, newRole: "admin" })}
                            >
                              Promouvoir admin
                            </Button>
                          )}
                          {role !== "partner" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPending({ target: u, newRole: "partner" })}
                            >
                              Partenaire
                            </Button>
                          )}
                          {role !== "user" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPending({ target: u, newRole: "user" })}
                            >
                              Utilisateur
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de rôle</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  Définir <strong>{pending.target.email}</strong> comme{" "}
                  <strong>{roleLabel(pending.newRole)}</strong> ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} disabled={working}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
