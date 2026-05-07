import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Database, Trash2, Sparkles, RefreshCw, Home } from "lucide-react";

export default function AdminDemo() {
  const [count, setCount] = useState<number | null>(null);
  const [aptCount, setAptCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"seed" | "purge" | "seed-apt" | "purge-apt" | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [{ count: c }, { count: ac }] = await Promise.all([
      supabase.from("residences").select("*", { count: "exact", head: true }).eq("is_demo", true),
      supabase.from("apartments").select("*", { count: "exact", head: true }).eq("is_demo", true),
    ]);
    setCount(c ?? 0);
    setAptCount(ac ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const seed = async () => {
    if (count && count > 0) {
      if (!confirm("Des données de démo existent déjà. Ajouter 50 résidences supplémentaires ?")) return;
    }
    setBusy("seed");
    const { data, error } = await supabase.rpc("seed_demo_data" as any);
    setBusy(null);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Démo créée", description: `${(data as any)?.residences_created ?? 50} résidences ajoutées.` });
    refresh();
  };

  const purge = async () => {
    if (!confirm("Supprimer TOUTES les résidences et leads marqués « démo » ? Cette action est irréversible.")) return;
    setBusy("purge");
    const { data, error } = await supabase.rpc("purge_demo_data" as any);
    setBusy(null);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Démo purgée", description: `${(data as any)?.residences_deleted ?? 0} résidences supprimées.` });
    refresh();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Database className="h-7 w-7 text-primary" /> Données de démonstration
        </h1>
        <p className="text-muted-foreground mt-1">
          Crée ou supprime un jeu de 50 résidences fictives en Belgique pour tester l'application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            État actuel
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>Toutes les données fictives portent le drapeau <code>is_demo = true</code>.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge variant="secondary" className="text-base">
            {loading ? "…" : count ?? 0} résidences de démo
          </Badge>
          {count !== null && count > 0 && (
            <span className="text-sm text-muted-foreground">Visibles sur le site public.</span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Seed démo
            </CardTitle>
            <CardDescription>
              Crée 50 résidences fictives avec logements, prix, services, activités et photos placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={seed} disabled={busy !== null} className="w-full">
              {busy === "seed" ? "Création en cours…" : "Créer les données de démo"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Purge démo
            </CardTitle>
            <CardDescription>
              Supprime toutes les résidences et leads marqués comme démo. Les vraies données sont préservées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={purge}
              disabled={busy !== null || (count ?? 0) === 0}
              variant="destructive"
              className="w-full"
            >
              {busy === "purge" ? "Suppression…" : "Purger les données de démo"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
