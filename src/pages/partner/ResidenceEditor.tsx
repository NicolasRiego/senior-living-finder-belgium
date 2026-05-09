import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Send, ArrowLeft } from "lucide-react";
import { AutosaveBadge } from "@/modules/partner/useAutosave";
import GeneralStep from "@/modules/partner/wizard/GeneralStep";
import AddressStep from "@/modules/partner/wizard/AddressStep";
import UnitsStep from "@/modules/partner/wizard/UnitsStep";
import PricingStep from "@/modules/partner/wizard/PricingStep";
import ServicesStep from "@/modules/partner/wizard/ServicesStep";
import ActivitiesStep from "@/modules/partner/wizard/ActivitiesStep";
import PhotosStep from "@/modules/partner/wizard/PhotosStep";
import ContactStep from "@/modules/partner/wizard/ContactStep";
import ValidationStep from "@/modules/partner/wizard/ValidationStep";

const steps = [
  { key: "general", label: "Général", Component: GeneralStep },
  { key: "address", label: "Adresse", Component: AddressStep },
  { key: "units", label: "Logements", Component: UnitsStep },
  { key: "pricing", label: "Tarifs", Component: PricingStep },
  { key: "services", label: "Services", Component: ServicesStep },
  { key: "activities", label: "Activités", Component: ActivitiesStep },
  { key: "photos", label: "Photos", Component: PhotosStep },
  { key: "contact", label: "Contact", Component: ContactStep },
  { key: "validation", label: "Validation", Component: ValidationStep },
];

export type ResidenceRow = {
  id: string;
  org_id: string;
  nom_fr: string;
  nom_nl: string | null;
  tagline_fr: string | null;
  tagline_nl: string | null;
  description_fr: string | null;
  description_nl: string | null;
  type_etablissement: string;
  status: string;
  slug: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  province: string | null;
  region: string | null;
  pays: string;
  latitude: number | null;
  longitude: number | null;
  proximity: any;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  capacity: number | null;
  rejected_reason: string | null;
};

export type StepProps = {
  residence: ResidenceRow;
  onChange: (patch: Partial<ResidenceRow>) => void;
  reload: () => Promise<void>;
  setExternalSaving: (s: "idle" | "saving" | "saved" | "error") => void;
};

const statusBadge: Record<string, { label: string; tone: string }> = {
  draft: { label: "Brouillon", tone: "bg-muted text-muted-foreground" },
  pending: { label: "En attente de validation", tone: "bg-amber-100 text-amber-900" },
  published: { label: "Publié", tone: "bg-primary/15 text-primary" },
  rejected: { label: "Refusé", tone: "bg-destructive/15 text-destructive" },
};

export default function ResidenceEditor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [residence, setResidence] = useState<ResidenceRow | null>(null);
  const [completeness, setCompleteness] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [external, setExternal] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("residences").select("*").eq("id", id).single();
    if (error) { toast.error(error.message); return; }
    setResidence(data as any);
    const { data: c } = await supabase.rpc("residence_completeness", { _residence_id: id });
    setCompleteness((c as number) ?? 0);
  };

  useEffect(() => { load(); }, [id]);

  if (!residence) {
    return <div className="container py-12 text-muted-foreground">Chargement…</div>;
  }

  const onChange = (patch: Partial<ResidenceRow>) => {
    setResidence((r) => (r ? { ...r, ...patch } : r));
  };

  const Step = steps[stepIdx].Component;
  const meta = statusBadge[residence.status] ?? statusBadge.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/partenaire" aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl">{residence.nom_fr}</h1>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${meta.tone}`}>{meta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AutosaveBadge status={external} />
          <Button variant="outline" asChild>
            <Link to={`/partenaire/residences/${residence.id}/preview`} target="_blank">
              <Eye className="h-4 w-4 mr-2" /> Aperçu
            </Link>
          </Button>
        </div>
      </div>

      {residence.status === "rejected" && residence.rejected_reason && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="font-semibold text-destructive">Refus de l'administration</p>
            <p className="text-muted-foreground mt-1">{residence.rejected_reason}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Complétude globale de la fiche</span>
            <span className="font-semibold">{completeness}%</span>
          </div>
          <Progress value={completeness} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Étapes" className="space-y-1">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStepIdx(i)}
              className={`w-full text-left rounded-lg px-4 py-3 text-base transition-colors ${
                i === stepIdx ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <span className="text-xs opacity-70">Étape {i + 1}</span>
              <div>{s.label}</div>
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          <Step
            residence={residence}
            onChange={onChange}
            reload={load}
            setExternalSaving={setExternal}
          />

          <div className="flex justify-between">
            <Button variant="outline" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => Math.max(0, i - 1))}>
              Précédent
            </Button>
            <Button disabled={stepIdx === steps.length - 1} onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}>
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
