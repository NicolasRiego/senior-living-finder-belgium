import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Eye, ArrowLeft, Save } from "lucide-react";
import { WizardSaveProvider, useWizardSave } from "@/modules/partner/WizardSaveContext";
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

// Steps that handle their own per-action persistence (no centralized Save button needed)
const OPERATIONAL_STEPS = new Set(["units", "pricing", "services", "activities", "photos", "validation"]);

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
  commune: string | null;
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
  onStepChange?: (stepKey: string) => void;
};

const statusBadge: Record<string, { label: string; tone: string }> = {
  draft: { label: "Brouillon", tone: "bg-muted text-muted-foreground" },
  pending: { label: "En attente de validation", tone: "bg-amber-100 text-amber-900" },
  published: { label: "Publié", tone: "bg-primary/15 text-primary" },
  rejected: { label: "Refusé", tone: "bg-destructive/15 text-destructive" },
};

function EditorShell({
  residence,
  completeness,
  onChange,
  reload,
}: {
  residence: ResidenceRow;
  completeness: number;
  onChange: (patch: Partial<ResidenceRow>) => void;
  reload: () => Promise<void>;
}) {
  const nav = useNavigate();
  const {
    dirtySteps, currentStep, setCurrentStep,
    saveCurrent, guardNavigation, currentIsDirty, isSaving,
  } = useWizardSave();

  const stepIdx = Math.max(0, steps.findIndex((s) => s.key === currentStep));
  const Step = steps[stepIdx].Component;
  const meta = statusBadge[residence.status] ?? statusBadge.draft;
  const isOperational = OPERATIONAL_STEPS.has(currentStep);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const contentPanel = document.querySelector(".content-panel-scroll");
    if (contentPanel) {
      contentPanel.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);


  const goToStep = (key: string) => guardNavigation(() => setCurrentStep(key));
  const goPrev = () => guardNavigation(() => setCurrentStep(steps[Math.max(0, stepIdx - 1)].key));
  const goNext = () => guardNavigation(() => setCurrentStep(steps[Math.min(steps.length - 1, stepIdx + 1)].key));
  const goBack = () => guardNavigation(() => nav(`/partenaire/residences#residence-${residence.id}`));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Retour">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl">{residence.nom_fr}</h1>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${meta.tone}`}>{meta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirtySteps.size > 0 && (
            <span className="text-sm text-orange-600 font-medium">
              {dirtySteps.size} modification{dirtySteps.size > 1 ? "s" : ""} non enregistrée{dirtySteps.size > 1 ? "s" : ""}
            </span>
          )}
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
          {steps.map((s, i) => {
            const dirty = dirtySteps.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => goToStep(s.key)}
                className={`w-full text-left rounded-lg px-4 py-3 text-base transition-colors ${
                  i === stepIdx ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <span className="text-xs opacity-70">Étape {i + 1}</span>
                <div className="flex items-center justify-between gap-2">
                  <span>{s.label}</span>
                  {dirty && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0"
                      aria-label="Modifications non enregistrées"
                      title="Modifications non enregistrées"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div ref={contentRef} className="content-panel-scroll space-y-6 scroll-mt-4">

          <Step
            residence={residence}
            onChange={onChange}
            reload={reload}
            setExternalSaving={() => {}}
            onStepChange={(key) => goToStep(key)}
          />

          {/* Centralized Save button */}
          <div className="flex items-center justify-end gap-3">
            {isOperational ? (
              <span className="text-sm text-muted-foreground italic">
                Les modifications de cette étape sont enregistrées automatiquement à chaque action.
              </span>
            ) : (
              <Button
                size="lg"
                onClick={saveCurrent}
                disabled={!currentIsDirty || isSaving}
                className={currentIsDirty ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
              </Button>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" disabled={stepIdx === 0} onClick={goPrev}>
              Précédent
            </Button>
            <Button disabled={stepIdx === steps.length - 1} onClick={goNext}>
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResidenceEditor() {
  const { id } = useParams<{ id: string }>();
  const [residence, setResidence] = useState<ResidenceRow | null>(null);
  const [completeness, setCompleteness] = useState(0);

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

  return (
    <WizardSaveProvider
      initialStep="general"
      renderModal={({ open, onSave, onDiscard, onStay }) => (
        <AlertDialog open={open} onOpenChange={(v) => { if (!v) onStay(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
              <AlertDialogDescription>
                Vous avez des modifications non enregistrées. Les sauvegarder avant de continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={onStay}>Rester</AlertDialogCancel>
              <Button variant="outline" onClick={onDiscard}>Ignorer</Button>
              <AlertDialogAction onClick={onSave}>Enregistrer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    >
      <EditorShell
        residence={residence}
        completeness={completeness}
        onChange={onChange}
        reload={load}
      />
    </WizardSaveProvider>
  );
}
