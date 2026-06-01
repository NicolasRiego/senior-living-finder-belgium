import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ChevronRight, Home, Pin } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  title_fr: string | null;
  type: "appartement" | "studio" | "chambre" | null;
  surface_m2: number | null;
  transaction_type: "sale" | "rent" | "both" | null;
  rent_price: number | null;
  sale_price: number | null;
  charges_monthly: number | null;
  status: string;
  is_pinned: boolean;
};

const PAGE_SIZE = 20;

const typeLabel: Record<string, string> = {
  appartement: "Appartement",
  studio: "Studio",
  chambre: "Chambre",
};

const txLabel: Record<string, string> = {
  sale: "Vendre",
  rent: "Louer",
  both: "Les 2",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  available: { label: "Dispo", className: "bg-[#16a34a] text-white" },
  reserved: { label: "Réservé", className: "bg-amber-500 text-white" },
  unavailable: { label: "Indisponible", className: "bg-gray-700 text-white" },
};

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat("fr-BE").format(n) + " €" : "—";

export default function ApartmentsList() {
  const { residenceId } = useParams<{ residenceId: string }>();
  const navigate = useNavigate();
  const { isAdmin, orgIds } = useAuth();
  const [residenceName, setResidenceName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Row | null>(null);

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
      setRows((data ?? []) as Row[]);
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
  const hasPinned = sortedRows.some((r) => r.is_pinned);
  const firstUnpinnedIndex = paged.findIndex((r) => !r.is_pinned);

  const togglePin = async (row: Row) => {
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
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Titre</th>
                  <th className="p-3 min-w-[130px]">Type</th>
                  <th className="p-3 whitespace-nowrap">Surface</th>
                  <th className="p-3 whitespace-nowrap">Transaction</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3 whitespace-nowrap">Statut</th>
                  <th className="p-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hasPinned && page === 1 && (
                  <tr className="bg-muted/30">
                    <td colSpan={7} className="p-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      📌 Appartements épinglés
                    </td>
                  </tr>
                )}
                {paged.map((a, idx) => {
                  const sm = statusMeta[a.status] ?? statusMeta.available;
                  const showUnpinnedHeader =
                    hasPinned && page === 1 && idx === firstUnpinnedIndex && firstUnpinnedIndex > 0;
                  return (
                    <Fragment key={a.id}>

                      {showUnpinnedHeader && (
                        <tr key={`sep-${a.id}`} className="bg-muted/10">
                          <td colSpan={7} className="p-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Autres appartements
                          </td>
                        </tr>
                      )}
                      <tr key={a.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{a.title_fr || "Sans titre"}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="outline" className="badge-fixed whitespace-nowrap">
                            {a.type ? typeLabel[a.type] : "—"}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap">{a.surface_m2 != null ? `${a.surface_m2} m²` : "—"}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="secondary" className="badge-fixed whitespace-nowrap">
                            {a.transaction_type ? txLabel[a.transaction_type] : "—"}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {(a.transaction_type === "rent" || a.transaction_type === "both") && (
                            <div>
                              {fmt(a.rent_price)}/mois
                              {a.charges_monthly != null && (
                                <span className="text-muted-foreground"> + {fmt(a.charges_monthly)} ch.</span>
                              )}
                            </div>
                          )}
                          {(a.transaction_type === "sale" || a.transaction_type === "both") && (
                            <div>{fmt(a.sale_price)}</div>
                          )}
                          {!a.transaction_type && "—"}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${sm.className}`}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant={a.is_pinned ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePin(a)}
                              aria-label={a.is_pinned ? "Désépingler" : "Épingler"}
                              className={a.is_pinned ? "bg-[#16a34a] hover:bg-[#15803d] text-white" : ""}
                            >
                              <Pin className={`h-4 w-4 ${a.is_pinned ? "fill-current" : ""}`} />
                              <span className="ml-1 hidden sm:inline">
                                {a.is_pinned ? "Épinglé" : "Épingler"}
                              </span>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/partenaire/residences/${residenceId}/appartements/${a.id}`}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setToDelete(a)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

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
