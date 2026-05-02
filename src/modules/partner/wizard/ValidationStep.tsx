import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Eye, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { toast } from "sonner";

export default function ValidationStep({ residence, reload }: StepProps) {
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.rpc("residence_completeness", { _residence_id: residence.id })
      .then(({ data }) => setScore((data as number) ?? 0));
  }, [residence.id]);

  const checks = [
    { ok: !!residence.nom_fr, label: "Nom de la résidence" },
    { ok: !!residence.description_fr && residence.description_fr.length >= 80, label: "Description (≥ 80 caractères)" },
    { ok: !!residence.adresse && !!residence.ville && !!residence.code_postal, label: "Adresse complète" },
    { ok: !!residence.region, label: "Région" },
    { ok: !!residence.contact_email || !!residence.contact_phone, label: "Au moins un contact (email ou téléphone)" },
  ];

  const allOk = checks.every((c) => c.ok) && score >= 60;
  const canSubmit = allOk && (residence.status === "draft" || residence.status === "rejected");

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_residence", { _residence_id: residence.id });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fiche soumise pour validation !");
    await reload();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Étape 9 — Validation & soumission</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Complétude globale</span>
            <span className="font-semibold">{score}%</span>
          </div>
          <Progress value={score} />
          <p className="text-sm text-muted-foreground mt-1">Minimum requis pour soumettre : 60%.</p>
        </div>

        <ul className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-3 text-base">
              {c.ok ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
              <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link to={`/partenaire/residences/${residence.id}/preview`} target="_blank">
              <Eye className="h-5 w-5 mr-2" /> Prévisualiser la fiche publique
            </Link>
          </Button>
          {residence.status === "pending" ? (
            <Button size="lg" disabled>En attente de validation par l'administration…</Button>
          ) : residence.status === "published" ? (
            <Button size="lg" disabled>Publiée ✓</Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={!canSubmit || submitting}>
              <Send className="h-5 w-5 mr-2" /> {submitting ? "Envoi…" : "Soumettre pour validation"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
