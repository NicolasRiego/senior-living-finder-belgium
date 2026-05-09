import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Building2,
  Home,
  Eye,
  Trash2,
  Undo2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  nom_fr: string;
  status: string;
  ville: string | null;
  type_etablissement: string;
  org_id: string;
  updated_at: string;
  completeness: number;
  apartments_count: number;
};

const statusLabel: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "outline" },
  published: { label: "Publié", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
  archived: { label: "Archivée", variant: "secondary" },
};

export default function MyResidences() {
  const { orgIds } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("residences")
      .select("id, nom_fr, status, ville, type_etablissement, org_id, updated_at")
      .in("org_id", orgIds.length ? orgIds : ["00000000-0000-0000-0000-000000000000"])
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);

    const list = data ?? [];
    const withMeta: Row[] = await Promise.all(
      list.map(async (r) => {
        const [{ data: c }, { count: aptCount }] = await Promise.all([
          supabase.rpc("residence_completeness", { _residence_id: r.id }),
          supabase
            .from("apartments")
            .select("id", { count: "exact", head: true })
            .eq("residence_id", r.id),
        ]);
        return {
          ...r,
          completeness: (c as number) ?? 0,
          apartments_count: aptCount ?? 0,
        };
      }),
    );
    setRows(withMeta);
    setLoading(false);
  };

  useEffect(() => {
    if (orgIds.length) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgIds.join(",")]);

  const onCreate = async () => {
    if (!orgIds.length) return;
    setCreating(true);
    const slug = `residence-${Date.now()}`;
    const { data, error } = await supabase
      .from("residences")
      .insert({
        org_id: orgIds[0],
        nom_fr: "Nouvelle résidence",
        slug,
        type_etablissement: "residence_services" as any,
        status: "draft" as any,
      })
      .select("id")
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.href = `/partenaire/residences/${data.id}/edition`;
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const { error } = await supabase.rpc("archive_residence", {
      _residence_id: deleteTarget.id,
      _reason: "deleted_by_partner",
    });
    setBusy(false);
    setDeleteTarget(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Résidence déplacée dans la corbeille");
    load();
  };

  const onRestore = async (r: Row) => {
    const { error } = await supabase.rpc("unarchive_residence", {
      _residence_id: r.id,
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

  const active = rows.filter((r) => r.status !== "archived");
  const archived = rows.filter((r) => r.status === "archived");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Mes résidences</h1>
          <p className="text-muted-foreground text-lg">
            Gérez vos fiches résidences
          </p>
        </div>
        <Button size="lg" onClick={onCreate} disabled={creating || !orgIds.length}>
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle résidence
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : active.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg">Aucune résidence pour l'instant.</p>
            <Button size="lg" onClick={onCreate} disabled={creating}>
              <Plus className="h-5 w-5 mr-2" /> Créer ma première résidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {active.map((r) => {
            const meta = statusLabel[r.status] ?? statusLabel.draft;
            return (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl">
                      <Link
                        to={`/partenaire/residences/${r.id}/edition`}
                        className="hover:underline"
                      >
                        {r.nom_fr}
                      </Link>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {r.ville ?? "Ville non renseignée"} ·{" "}
                      {r.type_etablissement.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Complétude</span>
                      <span className="font-semibold">{r.completeness}%</span>
                    </div>
                    <Progress value={r.completeness} />
                  </div>

                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {r.apartments_count} appartement
                    {r.apartments_count > 1 ? "s" : ""}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/partenaire/residences/${r.id}/edition`}>
                        Éditer
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/partenaire/residences/${r.id}/appartements`}>
                        <Home className="h-4 w-4 mr-2" /> Gérer les appartements
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/partenaire/residences/${r.id}/preview`}>
                        <Eye className="h-4 w-4 mr-2" /> Aperçu
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Corbeille */}
      {!loading && (
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 group">
              <Trash2 className="h-4 w-4" />
              <span>
                Corbeille ({archived.length} résidence
                {archived.length > 1 ? "s" : ""} supprimée
                {archived.length > 1 ? "s" : ""})
              </span>
              <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {archived.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucune résidence dans la corbeille.
              </p>
            ) : (
              <div className="grid gap-3">
                {archived.map((r) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(r)}
                      >
                        <Undo2 className="h-4 w-4 mr-2" /> Restaurer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette résidence ?</AlertDialogTitle>
            <AlertDialogDescription>
              La résidence{" "}
              <span className="font-semibold">{deleteTarget?.nom_fr}</span> sera
              déplacée dans la corbeille. Vous pourrez la restaurer pendant 30
              jours. Après ce délai, elle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
