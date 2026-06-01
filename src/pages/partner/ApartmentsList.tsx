import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ChevronRight, Home } from "lucide-react";
import { toast } from "sonner";
import ApartmentListCard, { type ApartmentRow } from "@/modules/apartments/ApartmentListCard";

const PAGE_SIZE = 20;

export default function ApartmentsList() {
  const { residenceId } = useParams<{ residenceId: string }>();
  const navigate = useNavigate();
  const { isAdmin, orgIds } = useAuth();
  const [residenceName, setResidenceName] = useState("");
  const [rows, setRows] = useState<ApartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ApartmentRow | null>(null);

  useEffect(() => {
    if (!residenceId) return;
    (async () => {
      setLoading(true);
      const { data: r, error: rErr } = await supabase
        .from("residences")
        .select("id, nom_fr, org_id")
        .eq("id", residenceId)
        .maybeSingle();
      if (rErr || !r) {
        toast.error("Résidence introuvable");
        navigate("/partenaire");
        return;
      }
      if (!isAdmin && !orgIds.includes(r.org_id)) {
        toast.error("Accès non autorisé");
        navigate("/partenaire");
        return;
      }
      setResidenceName(r.nom_fr);

      const { data, error } = await supabase
        .from("apartments")
        .select(
          "id, title_fr, type, surface_m2, transaction_type, rent_price, sale_price, charges_monthly, status, is_pinned",
        )
        .eq("residence_id", residenceId)
        .order("is_pinned", { ascending: false })
        .order("type", { ascending: true })
        .order("surface_m2", { ascending: true });
      if (error) toast.error(error.message);
      setRows((data ?? []) as ApartmentRow[]);
      setLoading(false);
    })();
  }, [residenceId, isAdmin, orgIds, navigate]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const t = (a.type ?? "").localeCompare(b.type ?? "");
      if (t !== 0) return t;
      return (a.surface_m2 ?? 0) - (b.surface_m2 ?? 0);
    });
  }, [rows]);

  const paged = useMemo(
    () => sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedRows, page],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pinned = paged.filter((r) => r.is_pinned);
  const unpinned = paged.filter((r) => !r.is_pinned);

  const togglePin = async (row: ApartmentRow) => {
    const next = !row.is_pinned;
    setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, is_pinned: next } : x)));
    const { error } = await supabase
      .from("apartments")
      .update({ is_pinned: next })
      .eq("id", row.id);
    if (error) {
      toast.error("Impossible de mettre à jour l'épinglage");
      setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, is_pinned: !next } : x)));
    } else {
      toast.success(next ? "Appartement épinglé" : "Appartement désépinglé");
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("apartments").delete().eq("id", toDelete.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appartement supprimé");
    setRows((r) => r.filter((x) => x.id !== toDelete.id));
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/partenaire" className="hover:text-foreground">Mon espace</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/edition`} className="hover:text-foreground">
          {residenceName || "Résidence"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Appartements</span>
      </nav>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Appartements</h1>
          <p className="text-muted-foreground">{rows.length} appartement{rows.length > 1 ? "s" : ""}</p>
        </div>
        <Button asChild size="lg">
          <Link to={`/partenaire/residences/${residenceId}/appartements/nouveau`}>
            <Plus className="h-5 w-5 mr-2" /> Ajouter un appartement
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg">Aucun appartement pour cette résidence.</p>
            <Button asChild>
              <Link to={`/partenaire/residences/${residenceId}/appartements/nouveau`}>
                <Plus className="h-5 w-5 mr-2" /> Créer le premier
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                📌 Appartements épinglés
              </h2>
              <div className="flex flex-col gap-2">
                {pinned.map((a) => (
                  <ApartmentListCard
                    key={a.id}
                    apartment={a}
                    residenceId={residenceId!}
                    onTogglePin={togglePin}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {unpinned.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Appartements
              </h2>
              <div className="flex flex-col gap-2">
                {unpinned.map((a) => (
                  <ApartmentListCard
                    key={a.id}
                    apartment={a}
                    residenceId={residenceId!}
                    onTogglePin={togglePin}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet appartement ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title_fr}" sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
