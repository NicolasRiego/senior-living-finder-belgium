import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Archive, ArchiveRestore, History, ExternalLink, Search, UserPlus } from "lucide-react";

type Row = {
  id: string;
  nom_fr: string;
  ville: string | null;
  status: string;
  org_id: string;
  owner_email: string | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  rejected: "destructive",
  archived: "outline",
};

export default function AdminResidences() {
  const { refresh } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [claimTarget, setClaimTarget] = useState<Row | null>(null);
  const [claiming, setClaiming] = useState(false);

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

  const claim = async () => {
    if (!claimTarget) return;
    setClaiming(true);
    const { error } = await supabase.rpc("admin_claim_residence", {
      _residence_id: claimTarget.id,
    });
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    toast.success(
      `Vous êtes maintenant propriétaire de ${claimTarget.nom_fr}. Espace partenaire mis à jour.`,
    );
    setClaimTarget(null);
    await refresh();
    load();
  };

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
                    <span className="text-muted-foreground">Propriétaire : </span>
                    {r.owner_email ? (
                      <span className="text-muted-foreground">{r.owner_email}</span>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Sans propriétaire
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setClaimTarget(r)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Me l'attribuer
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

      <AlertDialog open={!!claimTarget} onOpenChange={(o) => !o && setClaimTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>S'attribuer "{claimTarget?.nom_fr}" ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous deviendrez propriétaire de l'organisation rattachée à cette résidence
              et pourrez la gérer depuis l'espace partenaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={claim} disabled={claiming}>
              {claiming ? "Attribution…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
