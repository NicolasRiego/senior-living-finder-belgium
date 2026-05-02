import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw } from "lucide-react";

type Version = {
  id: string;
  version_number: number;
  reason: string | null;
  created_at: string;
  created_by: string | null;
  snapshot_json: any;
};

// Fields we care about for the diff (in display order)
const SCALAR_FIELDS: { key: string; label: string }[] = [
  { key: "nom_fr", label: "Nom (FR)" },
  { key: "nom_nl", label: "Nom (NL)" },
  { key: "tagline_fr", label: "Tagline (FR)" },
  { key: "tagline_nl", label: "Tagline (NL)" },
  { key: "description_fr", label: "Description (FR)" },
  { key: "description_nl", label: "Description (NL)" },
  { key: "type_etablissement", label: "Type établissement" },
  { key: "adresse", label: "Adresse" },
  { key: "code_postal", label: "Code postal" },
  { key: "ville", label: "Ville" },
  { key: "province", label: "Province" },
  { key: "region", label: "Région" },
  { key: "capacity", label: "Capacité" },
  { key: "contact_email", label: "E-mail contact" },
  { key: "contact_phone", label: "Téléphone" },
  { key: "website", label: "Site web" },
  { key: "status", label: "Statut" },
];

const COLLECTION_FIELDS: { key: string; label: string }[] = [
  { key: "unit_types", label: "Types de logements" },
  { key: "pricing", label: "Tarifs" },
  { key: "services", label: "Services" },
  { key: "photos", label: "Photos" },
];

function fmt(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function AdminVersions() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [residenceName, setResidenceName] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: res }, { data: vs, error }] = await Promise.all([
      supabase.from("residences").select("nom_fr").eq("id", id).maybeSingle(),
      supabase
        .from("residence_versions")
        .select("id, version_number, reason, created_at, created_by, snapshot_json")
        .eq("residence_id", id)
        .order("version_number", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setResidenceName(res?.nom_fr ?? "");
    const vsList = (vs ?? []) as Version[];
    setVersions(vsList);
    if (vsList.length >= 2) {
      setCompareRight(vsList[0].id);
      setCompareLeft(vsList[1].id);
    } else if (vsList.length === 1) {
      setCompareRight(vsList[0].id);
      setCompareLeft(vsList[0].id);
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const left = useMemo(() => versions.find((v) => v.id === compareLeft), [versions, compareLeft]);
  const right = useMemo(() => versions.find((v) => v.id === compareRight), [versions, compareRight]);

  const diffRows = useMemo(() => {
    if (!left || !right) return [];
    const out: { label: string; before: any; after: any; changed: boolean }[] = [];
    for (const f of SCALAR_FIELDS) {
      const a = left.snapshot_json?.[f.key] ?? null;
      const b = right.snapshot_json?.[f.key] ?? null;
      const changed = fmt(a) !== fmt(b);
      out.push({ label: f.label, before: a, after: b, changed });
    }
    for (const f of COLLECTION_FIELDS) {
      const a = (left.snapshot_json?.[f.key] ?? []) as any[];
      const b = (right.snapshot_json?.[f.key] ?? []) as any[];
      const changed = JSON.stringify(a) !== JSON.stringify(b);
      out.push({
        label: f.label,
        before: `${Array.isArray(a) ? a.length : 0} entrée(s)`,
        after: `${Array.isArray(b) ? b.length : 0} entrée(s)`,
        changed,
      });
    }
    return out;
  }, [left, right]);

  const onlyChanges = diffRows.filter((d) => d.changed);

  const restore = async () => {
    if (!restoringId) return;
    const { error } = await supabase.rpc("restore_residence_version", { _version_id: restoringId });
    if (error) { toast.error(error.message); return; }
    toast.success("Version restaurée");
    setRestoringId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/residences" aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl">Versions — {residenceName || "…"}</h1>
          <p className="text-muted-foreground">{versions.length} snapshot(s) historisé(s).</p>
        </div>
      </div>

      {loading ? <p>Chargement…</p> : versions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Aucune version pour cette résidence.
        </CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Versions list */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Historique</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-lg border p-3 text-sm ${
                    compareRight === v.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">v{v.version_number}</span>
                    <Badge variant="outline">{new Date(v.created_at).toLocaleDateString("fr-BE")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{v.reason ?? "—"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => setCompareLeft(v.id)}>
                      ← Avant
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCompareRight(v.id)}>
                      Après →
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRestoringId(v.id)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diff */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Comparaison : v{left?.version_number ?? "?"} → v{right?.version_number ?? "?"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {onlyChanges.length} champ(s) modifié(s).
              </p>
            </CardHeader>
            <CardContent>
              {onlyChanges.length === 0 ? (
                <p className="text-muted-foreground py-4">Aucune différence sur les champs suivis.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium">Champ</th>
                        <th className="py-2 pr-4 font-medium">Avant (v{left?.version_number})</th>
                        <th className="py-2 font-medium">Après (v{right?.version_number})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlyChanges.map((d, i) => (
                        <tr key={i} className="border-b align-top">
                          <td className="py-2 pr-4 font-medium">{d.label}</td>
                          <td className="py-2 pr-4 text-destructive/90 whitespace-pre-wrap break-words max-w-[280px]">
                            {fmt(d.before)}
                          </td>
                          <td className="py-2 text-primary whitespace-pre-wrap break-words max-w-[280px]">
                            {fmt(d.after)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!restoringId} onOpenChange={(o) => !o && setRestoringId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer cette version ?</DialogTitle>
            <DialogDescription>
              Toutes les informations actuelles (général, logements, tarifs, services, photos) seront
              écrasées par celles de cette version. L'opération est tracée et un nouveau snapshot
              sera créé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoringId(null)}>Annuler</Button>
            <Button onClick={restore}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
