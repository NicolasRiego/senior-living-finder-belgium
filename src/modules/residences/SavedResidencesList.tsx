import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Trash2 } from "lucide-react";
import { useFavorites } from "@/modules/favorites/useFavorites";

type Row = {
  residence_id: string;
  residences: {
    id: string;
    nom_fr: string;
    slug: string;
    ville: string | null;
    region: string | null;
    type_etablissement: string | null;
  } | null;
};

const FALLBACK_COVER =
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800";

export function SavedResidencesList() {
  const { user } = useAuth();
  const { toggle, refresh } = useFavorites();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select(
          "residence_id, residences:residences(id, nom_fr, slug, ville, region, type_etablissement)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows(((data ?? []) as unknown) as Row[]);
      setLoading(false);
    })();
  }, [user]);

  const handleRemove = async (id: string) => {
    await toggle(id);
    setRows((r) => r.filter((x) => x.residence_id !== id));
    refresh();
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-base">Vous n'avez pas encore enregistré de résidence.</p>
          <Button asChild>
            <Link to="/residences">Explorer les résidences →</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((r) =>
        r.residences ? (
          <Card key={r.residence_id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-40 w-full sm:h-auto sm:w-40 shrink-0 bg-muted">
                <img
                  src={FALLBACK_COVER}
                  alt={r.residences.nom_fr}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-tight break-words">
                    {r.residences.nom_fr}
                  </h3>
                  {r.residences.ville && (
                    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[r.residences.ville, r.residences.region].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/residences/${r.residences.slug}`}>
                      <Building2 className="h-4 w-4" /> Voir la résidence
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(r.residence_id)}
                    aria-label="Retirer cette résidence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ) : null
      )}
    </div>
  );
}
