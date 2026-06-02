import { useState } from "react";
import { FolderOpen, Trash2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useBudgetSimulations, notifySimulationsChanged, type BudgetSimulationRow } from "./budgetSimulations";
import type { SavedApartment } from "./savedApartments";

export function SimulationHistory({
  apartments,
  onOpen,
}: {
  apartments: SavedApartment[];
  onOpen: (sim: BudgetSimulationRow) => void;
}) {
  const { items, loading } = useBudgetSimulations();
  const [toDelete, setToDelete] = useState<BudgetSimulationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const aptById = new Map(apartments.map((a) => [a.id, a]));

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("budget_simulations")
      .delete()
      .eq("id", toDelete.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Simulation supprimée");
    setToDelete(null);
    notifySimulationsChanged();
  };

  if (loading) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement…</CardContent></Card>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-2">
          <Calculator className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-base">Vous n'avez pas encore enregistré de simulation.</p>
          <p className="text-sm text-muted-foreground">
            Créez une simulation et cliquez sur "Sauvegarder la simulation".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => {
          const apt = aptById.get(s.apartment_id);
          const logementLine = apt
            ? `${apt.residence_nom_fr} — ${apt.type ?? "logement"}${apt.surface_m2 ? ` ${apt.surface_m2} m²` : ""}`
            : "Logement non disponible";
          return (
            <Card key={s.id}>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold break-words">{s.name}</h3>
                  <p className="text-sm text-muted-foreground break-words">Logement : {logementLine}</p>
                  <p className="text-sm">
                    Total mensuel : <strong className="text-primary">{s.total_monthly.toLocaleString("fr-BE")} €/mois</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dernière mise à jour : {new Date(s.updated_at).toLocaleDateString("fr-BE")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => onOpen(s)}
                    disabled={!apt}
                    title={!apt ? "Logement plus disponible" : undefined}
                  >
                    <FolderOpen className="h-4 w-4" /> Ouvrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setToDelete(s)}
                    aria-label="Supprimer cette simulation"
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette simulation ?</DialogTitle>
            <DialogDescription>
              Les données de simulation pour ce logement seront supprimées définitivement.
              Le logement reviendra à son état par défaut. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
