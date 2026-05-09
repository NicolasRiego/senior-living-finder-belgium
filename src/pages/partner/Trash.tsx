import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ArchivedResidenceDialog } from "./ArchivedResidenceDialog";

type Row = {
  id: string;
  nom_fr: string;
  status: string;
  ville: string | null;
  type_etablissement: string;
  org_id: string;
  updated_at: string;
};

export default function Trash() {
  const { orgIds } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("residences")
      .select("id, nom_fr, status, ville, type_etablissement, org_id, updated_at")
      .in("org_id", orgIds.length ? orgIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "archived")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    if (orgIds.length) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgIds.join(",")]);

  const restoreById = async (id: string) => {
    const { error } = await supabase.rpc("unarchive_residence", {
      _residence_id: id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Résidence restaurée en brouillon. Toutes vos données ont été conservées.",
    );
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Corbeille</h1>
        <p className="text-muted-foreground text-lg">
          Résidences supprimées — restaurables pendant 30 jours
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg">La corbeille est vide.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="bg-muted/30">
              <CardContent className="py-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.nom_fr}</span>
                    <Badge variant="secondary">Archivée</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.ville ?? "Ville non renseignée"} ·{" "}
                    {r.type_etablissement.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supprimée le{" "}
                    {new Date(r.updated_at).toLocaleDateString("fr-FR")} ·
                    Données conservées
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewId(r.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> Consulter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreById(r.id)}
                  >
                    <Undo2 className="h-4 w-4 mr-2" /> Restaurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ArchivedResidenceDialog
        residenceId={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
        onRestore={restoreById}
      />
    </div>
  );
}
