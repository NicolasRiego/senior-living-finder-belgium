import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Archive, ArchiveRestore, History, ExternalLink, Search } from "lucide-react";

type Row = {
  id: string;
  nom_fr: string;
  ville: string | null;
  type_etablissement: string;
  status: string;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  rejected: "destructive",
  archived: "outline",
};

export default function AdminResidences() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState("");

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("residences")
      .select("id, nom_fr, ville, type_etablissement, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status !== "all") query = query.eq("status", status as any);
    if (q.trim()) query = query.ilike("nom_fr", `%${q.trim()}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-1">Résidences</h1>
        <p className="text-muted-foreground">Toutes les fiches, tous statuts confondus.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom…" className="pl-9 h-11" onKeyDown={(e) => e.key === "Enter" && load()} />
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
        <Button variant="outline" onClick={load}>Filtrer</Button>
      </div>

      {loading ? <p>Chargement…</p> : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Aucune résidence.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-lg">{r.nom_fr}</h2>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.ville ?? "—"} · {r.type_etablissement.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
