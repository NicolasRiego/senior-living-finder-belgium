import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Mail, Building2, ShieldCheck } from "lucide-react";

type FavRow = { residence_id: string; residences: { nom_fr: string; ville: string | null; slug: string } | null };
type LeadRow = { id: string; created_at: string; status: string; residence_id: string; residences: { nom_fr: string; slug: string } | null };

export default function MyAccountPage() {
  const { user, isAdmin, isPartner } = useAuth();
  const [favorites, setFavorites] = useState<FavRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: favs }, { data: ls }] = await Promise.all([
        supabase
          .from("favorites")
          .select("residence_id, residences:residences(nom_fr, ville, slug)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("leads")
          .select("id, created_at, status, residence_id, residences:residences(nom_fr, slug)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setFavorites((favs ?? []) as any);
      setLeads((ls ?? []) as any);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="container py-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Mon espace</h1>
          <p className="text-lg text-muted-foreground">Bonjour {user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button asChild>
              <Link to="/admin/validation">
                <ShieldCheck className="h-4 w-4 mr-2" /> Espace admin
              </Link>
            </Button>
          )}
          {isPartner && (
            <Button asChild variant="outline">
              <Link to="/partenaire">
                <Building2 className="h-4 w-4 mr-2" /> Espace partenaire
              </Link>
            </Button>
          )}
        </div>
      </header>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl">Mes favoris</h2>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : favorites.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-base">Aucune résidence sauvegardée pour l'instant.</p>
              <Button asChild><Link to="/residences">Découvrir les résidences</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((f) => f.residences && (
              <Card key={f.residence_id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link to={`/residences/${f.residences.slug}`} className="hover:underline">
                      {f.residences.nom_fr}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground">{f.residences.ville ?? "—"}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl">Mes demandes de contact</h2>
        </div>
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
      </section>
    </div>
  );
}
