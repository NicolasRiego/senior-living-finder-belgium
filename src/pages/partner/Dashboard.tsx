import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Building2,
  Eye,
  Mail,
  Home,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type Totals = {
  residences_published: number;
  residences_total: number;
  apartments_total: number;
  views_30d: number;
  leads_30d: number;
};

export default function PartnerDashboard() {
  const { orgIds, isAdmin } = useAuth();
  const [totals, setTotals] = useState<Totals>({
    residences_published: 0,
    residences_total: 0,
    apartments_total: 0,
    views_30d: 0,
    leads_30d: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: residences, error } = await supabase
      .from("residences")
      .select("id, status")
      .in("org_id", orgIds.length ? orgIds : ["00000000-0000-0000-0000-000000000000"]);
    if (error) toast.error(error.message);

    const list = residences ?? [];
    const activeIds = list
      .filter((r) => r.status !== "archived")
      .map((r) => r.id);

    let apartments_total = 0;
    let views_30d = 0;
    let leads_30d = 0;

    if (activeIds.length) {
      const [{ count: aptCount }, statsRes] = await Promise.all([
        supabase
          .from("apartments")
          .select("id", { count: "exact", head: true })
          .in("residence_id", activeIds),
        (supabase.from("residence_stats_30d" as any) as any)
          .select("views_30d, leads_30d")
          .in("residence_id", activeIds),
      ]);
      apartments_total = aptCount ?? 0;
      const stats = (statsRes.data as Array<{ views_30d: number; leads_30d: number }>) ?? [];
      views_30d = stats.reduce((s, r) => s + (r.views_30d ?? 0), 0);
      leads_30d = stats.reduce((s, r) => s + (r.leads_30d ?? 0), 0);
    }

    setTotals({
      residences_published: list.filter((r) => r.status === "published").length,
      residences_total: activeIds.length,
      apartments_total,
      views_30d,
      leads_30d,
    });
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

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-sm flex items-start gap-3 flex-wrap">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-[260px]">
            <p className="font-semibold text-foreground">Mode administrateur</p>
            <p className="text-muted-foreground mt-1">
              Vous visualisez cet espace en tant qu'admin. Vous avez accès à
              toutes les résidences dont vous êtes propriétaire. Pour gérer
              d'autres résidences, attribuez-les vous depuis l'espace admin.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/residences">
              Aller à l'espace admin <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl">Tableau de bord</h1>
        <p className="text-muted-foreground text-lg">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Building2 className="h-5 w-5" />}
              label="Résidences publiées"
              value={totals.residences_published}
              hint={`sur ${totals.residences_total}`}
            />
            <StatCard
              icon={<Home className="h-5 w-5" />}
              label="Appartements"
              value={totals.apartments_total}
            />
            <StatCard
              icon={<Eye className="h-5 w-5" />}
              label="Vues (30 j)"
              value={totals.views_30d}
            />
            <StatCard
              icon={<Mail className="h-5 w-5" />}
              label="Leads (30 j)"
              value={totals.leads_30d}
            />
          </div>

          <Card>
            <CardContent className="py-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-lg">Gérer mes résidences</p>
                <p className="text-muted-foreground text-sm">
                  Éditer, publier, ajouter des appartements ou supprimer une
                  résidence.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" asChild>
                  <Link to="/partenaire/residences">
                    Mes résidences <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button onClick={onCreate} disabled={creating || !orgIds.length}>
                  <Plus className="h-4 w-4 mr-2" /> Nouvelle résidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon} {label}
        </div>
        <div className="mt-2 text-3xl font-display font-semibold">{value}</div>
        {hint && (
          <div className="text-xs text-muted-foreground mt-1">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
