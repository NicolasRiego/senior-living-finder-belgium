import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Building2, Eye, MousePointerClick, Mail, Heart } from "lucide-react";
import { toast } from "sonner";

type Stats = {
  views_30d: number;
  clicks_phone_30d: number;
  clicks_email_30d: number;
  clicks_website_30d: number;
  clicks_contact_30d: number;
  leads_30d: number;
  favorites_total: number;
};

type Row = {
  id: string;
  nom_fr: string;
  status: string;
  ville: string | null;
  type_etablissement: string;
  org_id: string;
  completeness: number;
  stats: Stats;
};

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  pending: { label: "En attente", variant: "outline" },
  published: { label: "Publié", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
  archived: { label: "Archivé", variant: "secondary" },
};

export default function PartnerDashboard() {
  const { orgIds } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: residences, error } = await supabase
      .from("residences")
      .select("id, nom_fr, status, ville, type_etablissement, org_id")
      .in("org_id", orgIds.length ? orgIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);

    const list = residences ?? [];
    const emptyStats: Stats = {
      views_30d: 0, clicks_phone_30d: 0, clicks_email_30d: 0,
      clicks_website_30d: 0, clicks_contact_30d: 0, leads_30d: 0, favorites_total: 0,
    };
    const withScore: Row[] = await Promise.all(
      list.map(async (r) => {
        const [{ data: c }, { data: s }] = await Promise.all([
          supabase.rpc("residence_completeness", { _residence_id: r.id }),
          (supabase.from("residence_stats_30d" as any) as any)
            .select("*").eq("residence_id", r.id).maybeSingle(),
        ]);
        return {
          ...r,
          completeness: (c as number) ?? 0,
          stats: (s as Stats) ?? emptyStats,
        };
      }),
    );
    setRows(withScore);
    setLoading(false);
  };

  useEffect(() => {
    if (orgIds.length) load();
    else setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Tableau de bord</h1>
          <p className="text-muted-foreground text-lg">Gérez vos fiches résidences</p>
        </div>
        <Button size="lg" onClick={onCreate} disabled={creating || !orgIds.length}>
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle résidence
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
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
          {rows.map((r) => {
            const meta = statusLabel[r.status] ?? statusLabel.draft;
            return (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl">
                      <Link to={`/partenaire/residences/${r.id}/edition`} className="hover:underline">
                        {r.nom_fr}
                      </Link>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {r.ville ?? "Ville non renseignée"} · {r.type_etablissement.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Complétude</span>
                        <span className="font-semibold">{r.completeness}%</span>
                      </div>
                      <Progress value={r.completeness} />
                    </div>
                    <Button variant="outline" asChild>
                      <Link to={`/partenaire/residences/${r.id}/edition`}>Éditer</Link>
                    </Button>
                  </div>

                  {r.status === "published" && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">
                        Statistiques (30 derniers jours)
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatTile icon={<Eye className="h-4 w-4" />} label="Vues fiche" value={r.stats.views_30d} />
                        <StatTile icon={<MousePointerClick className="h-4 w-4" />} label="Clics contact" value={r.stats.clicks_contact_30d + r.stats.clicks_phone_30d + r.stats.clicks_email_30d} />
                        <StatTile icon={<Mail className="h-4 w-4" />} label="Demandes" value={r.stats.leads_30d} />
                        <StatTile icon={<Heart className="h-4 w-4" />} label="Favoris" value={r.stats.favorites_total} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}
