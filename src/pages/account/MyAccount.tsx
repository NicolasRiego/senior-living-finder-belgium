import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Heart, Mail, Building2, Shield, Home, Calculator, History } from "lucide-react";
import { toast } from "sonner";
import { SavedApartmentsList } from "@/modules/apartments/SavedApartmentsList";
import { SavedResidencesList } from "@/modules/residences/SavedResidencesList";
import { BudgetSimulator } from "@/modules/apartments/BudgetSimulator";
import { SimulationHistory } from "@/modules/apartments/SimulationHistory";
import { useSavedApartments } from "@/modules/apartments/savedApartments";
import { useSimulatorLogements, SIMULATOR_MAX } from "@/modules/apartments/simulatorLogements";
import type { BudgetSimulationRow } from "@/modules/apartments/budgetSimulations";

type LeadRow = { id: string; created_at: string; status: string; residence_id: string; residences: { nom_fr: string; slug: string } | null };

export default function MyAccountPage() {
  const { user, isAdmin, isPartner } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("favorites");
  const [simulateId, setSimulateId] = useState<string | null>(null);
  const [editingSim, setEditingSim] = useState<BudgetSimulationRow | null>(null);
  const [fullErrorOpen, setFullErrorOpen] = useState(false);
  const { items: savedApartments } = useSavedApartments();
  const { items: simulatorItems, add: addToSim, remove: removeFromSim } = useSimulatorLogements();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ls } = await supabase
        .from("leads")
        .select("id, created_at, status, residence_id, residences:residences(nom_fr, slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLeads((ls ?? []) as any);
      setLoading(false);
    })();
  }, [user]);


  const handleSimulate = async (id: string) => {
    // Ensure apartment is in simulator list (max 10)
    const alreadyIn = simulatorItems.some((a) => a.id === id);
    if (!alreadyIn) {
      const res = await addToSim(id);
      if (res === "full") return; // toast already shown
      if (res === "error") return;
    }
    setEditingSim(null);
    setSimulateId(id);
    setTab("simulation");
  };

  const handleEditSimulation = async (sim: BudgetSimulationRow) => {
    const alreadyIn = simulatorItems.some((a) => a.id === sim.apartment_id);
    if (!alreadyIn) {
      // Need to re-add
      if (simulatorItems.length >= SIMULATOR_MAX) {
        setFullErrorOpen(true);
        return;
      }
      const res = await addToSim(sim.apartment_id);
      if (res === "full") {
        setFullErrorOpen(true);
        return;
      }
      if (res === "ok") {
        toast.info("Le logement a été remis dans votre simulateur");
      } else if (res === "error") {
        return;
      }
    }
    setEditingSim(sim);
    setSimulateId(sim.apartment_id);
    setTab("simulation");
  };

  return (
    <div className="container py-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Mon espace</h1>
          <p className="text-lg text-muted-foreground">Bonjour {user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/mon-espace/donnees">
              <Shield className="h-4 w-4 mr-2" /> Mes données (RGPD)
            </Link>
          </Button>
          {!isAdmin && isPartner && (
            <Button asChild variant="outline">
              <Link to="/partenaire">
                <Building2 className="h-4 w-4 mr-2" /> Espace partenaire
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted p-1">
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="h-4 w-4" /> Mes résidences
          </TabsTrigger>
          <TabsTrigger value="apartments" className="gap-2">
            <Home className="h-4 w-4" /> Mes logements
          </TabsTrigger>
          <TabsTrigger value="simulation" className="gap-2">
            <Calculator className="h-4 w-4" /> Simulation budget
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Mail className="h-4 w-4" /> Mes demandes
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Historique de simulations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          <SavedResidencesList />
        </TabsContent>

        <TabsContent value="apartments" className="mt-6">
          <SavedApartmentsList onSimulate={handleSimulate} />
        </TabsContent>

        <TabsContent value="simulation" className="mt-6">
          <BudgetSimulator
            apartments={simulatorItems}
            initialId={simulateId}
            editing={editingSim}
            onSaved={() => setEditingSim(null)}
            onRemove={(id) => { void removeFromSim(id); }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <SimulationHistory apartments={savedApartments} onEdit={handleEditSimulation} />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          {loading ? null : leads.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              Vous n'avez envoyé aucune demande pour l'instant.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {leads.map((l) => (
                <Card key={l.id}>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {l.residences ? (
                          <Link to={`/residences/${l.residences.slug}`} className="hover:underline">
                            {l.residences.nom_fr}
                          </Link>
                        ) : "Résidence"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Envoyée le {new Date(l.created_at).toLocaleDateString("fr-BE")}
                      </p>
                    </div>
                    <Badge variant="outline">{l.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={fullErrorOpen} onOpenChange={setFullErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impossible de charger cette simulation</DialogTitle>
            <DialogDescription>
              Votre simulateur contient déjà {SIMULATOR_MAX} logements. Retirez un
              logement du simulateur pour modifier cette simulation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFullErrorOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setFullErrorOpen(false);
                setTab("simulation");
              }}
            >
              Aller au simulateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
