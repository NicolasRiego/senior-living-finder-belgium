import { useEffect, useState } from "react";
import { Plus, Rocket, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/version";

type AppVersionRow = {
  id: string;
  version: string;
  commit_sha: string | null;
  released_at: string;
  notes: string | null;
};

export default function AdminDeployHistory() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AppVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(APP_VERSION);
  const [sha, setSha] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_versions" as any)
      .select("id, version, commit_sha, released_at, notes")
      .order("released_at", { ascending: false })
      .limit(20);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as unknown as AppVersionRow[]);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!version.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("app_versions" as any)
      .insert({ version: version.trim(), commit_sha: sha.trim() || null, notes: notes.trim() || null });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Version enregistrée" });
    setOpen(false);
    setSha(""); setNotes("");
    await load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Historique des déploiements</h1>
          <p className="text-muted-foreground">20 dernières versions publiées (rollback via Git tag/release).</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nouvelle version</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un déploiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Version</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.4.2" />
              </div>
              <div>
                <Label>Commit SHA (optionnel)</Label>
                <Input value={sha} onChange={(e) => setSha(e.target.value)} placeholder="a1b2c3d" />
              </div>
              <div>
                <Label>Notes (optionnel)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Fix paiement…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version courante : <Badge variant="outline">{APP_VERSION}</Badge></CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">Aucune version enregistrée pour l'instant.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-semibold">{r.version}
                      {r.commit_sha && <span className="ml-2 font-mono text-xs text-muted-foreground">{r.commit_sha}</span>}
                    </div>
                    {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.released_at).toLocaleString("fr-BE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
