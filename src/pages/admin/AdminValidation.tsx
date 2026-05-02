import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ExternalLink, History } from "lucide-react";

type Row = {
  id: string;
  nom_fr: string;
  ville: string | null;
  type_etablissement: string;
  status: string;
  created_at: string;
};

export default function AdminValidation() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("residences")
      .select("id, nom_fr, ville, type_etablissement, status, created_at")
      .eq("status", "pending")
      .order("created_at");
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_residence", { _residence_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Résidence publiée !");
    load();
  };

  const reject = async () => {
    if (!rejectingId) return;
    const { error } = await supabase.rpc("reject_residence", { _residence_id: rejectingId, _reason: rejectReason });
    if (error) { toast.error(error.message); return; }
    toast.success("Refus enregistré");
    setRejectingId(null);
    setRejectReason("");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-1">Validation</h1>
        <p className="text-muted-foreground">
          Fiches en attente de validation : <strong>{rows.length}</strong>
        </p>
      </div>

      {loading ? <p>Chargement…</p> : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Aucune fiche en attente. ✨
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-xl">{r.nom_fr}</CardTitle>
                <p className="text-muted-foreground">
                  {r.ville ?? "—"} · {r.type_etablissement.replace(/_/g, " ")}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link to={`/partenaire/residences/${r.id}/preview`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" /> Voir l'aperçu
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/admin/residences/${r.id}/versions`}>
                    <History className="h-4 w-4 mr-2" /> Versions
                  </Link>
                </Button>
                <Button onClick={() => approve(r.id)}>
                  <Check className="h-4 w-4 mr-2" /> Approuver & publier
                </Button>
                <Dialog open={rejectingId === r.id} onOpenChange={(o) => !o && setRejectingId(null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" onClick={() => setRejectingId(r.id)}>
                      <X className="h-4 w-4 mr-2" /> Refuser
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Refuser la fiche</DialogTitle>
                      <DialogDescription>Indiquez le motif (visible par le partenaire).</DialogDescription>
                    </DialogHeader>
                    <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Ex: descriptions trop courtes, photos manquantes…" />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRejectingId(null)}>Annuler</Button>
                      <Button variant="destructive" onClick={reject} disabled={!rejectReason.trim()}>
                        Refuser
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

