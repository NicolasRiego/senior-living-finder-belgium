import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Archive, ArchiveRestore, History, ExternalLink, Search, UserPlus, UserCheck, X } from "lucide-react";

type Row = {
  id: string;
  nom_fr: string;
  ville: string | null;
  status: string;
  org_id: string;
  owner_email: string | null;
};

type ProfileResult = {
  user_id: string;
  display_name: string | null;
  email: string;
  account_type: string;
  is_partner: boolean;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  rejected: "destructive",
  archived: "outline",
};

export default function AdminResidences() {
  const { refresh, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState("");

  // Attribution modal state
  const [assignTarget, setAssignTarget] = useState<Row | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [includeAll, setIncludeAll] = useState(false);
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileResult | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_residences_with_orgs");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q.trim() && !r.nom_fr.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  const archive = async () => {
    if (!archivingId) return;
    const { error } = await supabase.rpc("archive_residence", {
      _residence_id: archivingId,
      _reason: archiveReason || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Résidence archivée");
    setArchivingId(null);
    setArchiveReason("");
    load();
  };

  const unarchive = async (id: string) => {
    const { error } = await supabase.rpc("unarchive_residence", { _residence_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Résidence désarchivée (en brouillon)");
    load();
  };

  // Reset attribution modal when closed
  const closeAssign = () => {
    setAssignTarget(null);
    setSearchQ("");
    setResults([]);
    setSelectedUser(null);
    setIncludeAll(false);
  };

  // Search profiles when query/includeAll changes
  useEffect(() => {
    if (!assignTarget) return;
    let cancelled = false;
    const run = async () => {
      setSearching(true);
      const { data, error } = await supabase.rpc("admin_search_profiles_for_attribution", {
        _query: searchQ,
        _only_partners: !includeAll,
      });
      if (cancelled) return;
      if (error) toast.error(error.message);
      else setResults((data ?? []) as ProfileResult[]);
      setSearching(false);
    };
    const t = setTimeout(run, searchQ.length > 0 && searchQ.length < 2 ? 0 : 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [assignTarget, searchQ, includeAll]);

  const assignTo = async (targetUserId: string, label: string, isSelf: boolean) => {
    if (!assignTarget) return;
    setAssigning(true);
    const { data, error } = await supabase.rpc("admin_assign_residence", {
      _residence_id: assignTarget.id,
      _target_user_id: targetUserId,
    });
    setAssigning(false);
    if (error) { toast.error(error.message); return; }
    const promoted = (data as any)?.promoted;
    toast.success(`Résidence attribuée à ${label} ✓`);
    if (promoted) {
      toast.info("L'utilisateur a été promu au rôle Partenaire et peut maintenant gérer cette résidence.");
    }
    closeAssign();
    if (isSelf) await refresh();
    load();
  };

  const initial = (p: ProfileResult) =>
    (p.display_name?.trim()?.[0] || p.email?.[0] || "?").toUpperCase();

  const myEmail = user?.email ?? "moi";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-1">Résidences</h1>
        <p className="text-muted-foreground">Toutes les fiches, tous statuts confondus.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom…" className="pl-9 h-11" />
        </div>
        <select
          className="h-11 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tous statuts</option>
          <option value="draft">Brouillon</option>
          <option value="pending">En attente</option>
          <option value="published">Publié</option>
          <option value="rejected">Refusé</option>
          <option value="archived">Archivé</option>
        </select>
        <Button variant="outline" onClick={load}>Rafraîchir</Button>
      </div>

      {loading ? <p>Chargement…</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Aucune résidence.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-semibold text-lg">{r.nom_fr}</h2>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.ville ?? "—"}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Géré par : </span>
                    {r.owner_email ? (
                      <span className="font-medium">{r.owner_email}</span>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Non attribué
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAssignTarget(r)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {r.owner_email ? "Réattribuer" : "Attribuer"}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/partenaire/residences/${r.id}/preview`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" /> Aperçu
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/residences/${r.id}/versions`}>
                      <History className="h-4 w-4 mr-2" /> Versions
                    </Link>
                  </Button>
                  {r.status !== "archived" ? (
                    <Dialog open={archivingId === r.id} onOpenChange={(o) => !o && setArchivingId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setArchivingId(r.id)}>
                          <Archive className="h-4 w-4 mr-2" /> Archiver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Archiver "{r.nom_fr}" ?</DialogTitle>
                          <DialogDescription>
                            La fiche disparaîtra du public. Vous pourrez la désarchiver plus tard.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          rows={3}
                          value={archiveReason}
                          onChange={(e) => setArchiveReason(e.target.value)}
                          placeholder="Motif (optionnel)"
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setArchivingId(null)}>Annuler</Button>
                          <Button variant="destructive" onClick={archive}>Archiver</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => unarchive(r.id)}>
                      <ArchiveRestore className="h-4 w-4 mr-2" /> Désarchiver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && closeAssign()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attribuer "{assignTarget?.nom_fr}"</DialogTitle>
            <DialogDescription>
              Choisissez à qui attribuer la gestion de cette résidence.
            </DialogDescription>
          </DialogHeader>

          {/* Option A */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium">M'attribuer cette résidence</div>
            <p className="text-sm text-muted-foreground">
              Vous deviendrez propriétaire ({myEmail}).
            </p>
            <Button
              className="w-full"
              disabled={assigning}
              onClick={() => user?.id && assignTo(user.id, myEmail, true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              M'attribuer
            </Button>
          </div>

          {/* Option B */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium">Attribuer à un autre utilisateur</div>

            {selectedUser ? (
              <div className="rounded-md border bg-muted/40 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {initial(selectedUser)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {selectedUser.display_name || selectedUser.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedUser.email} · {selectedUser.account_type}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} aria-label="Désélectionner">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Rechercher par email ou nom..."
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={includeAll} onCheckedChange={(c) => setIncludeAll(!!c)} />
                  Afficher aussi les utilisateurs sans rôle partenaire
                </label>
                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {searching && results.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Recherche…</div>
                  ) : results.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Aucun utilisateur.</div>
                  ) : (
                    results.map((p) => (
                      <button
                        key={p.user_id}
                        type="button"
                        onClick={() => setSelectedUser(p)}
                        className="w-full text-left p-3 hover:bg-muted flex items-center gap-3"
                      >
                        <div className="h-9 w-9 rounded-full bg-muted-foreground/20 flex items-center justify-center font-semibold text-sm">
                          {initial(p)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {p.display_name || p.email}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.email}
                          </div>
                        </div>
                        <Badge variant={p.is_partner ? "default" : "outline"} className="text-xs">
                          {p.is_partner ? "Partenaire" : p.account_type}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAssign}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!selectedUser || assigning}
              onClick={() =>
                selectedUser &&
                assignTo(
                  selectedUser.user_id,
                  selectedUser.display_name || selectedUser.email,
                  selectedUser.user_id === user?.id,
                )
              }
            >
              {assigning ? "Attribution…" : "Confirmer l'attribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
