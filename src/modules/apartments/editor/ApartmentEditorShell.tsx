import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save, ChevronRight, Eye } from "lucide-react";
import {
  WizardSaveProvider, useWizardSave,
} from "@/modules/partner/WizardSaveContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApartmentFormProvider, useApartmentStep } from "./ApartmentFormContext";
import { APT_STEPS, type StepKey, type StepDef } from "./stepDefs";
import {
  IdentificationStep, LocationStep, TransactionStep,
  EquipmentsStep, DescriptionStep, PhotosStep,
} from "./basicSteps";
import {
  GeneralStep, InteriorStep, ExteriorStep,
  InstallationsStep, EnergyStep, FinancesStep,
} from "./detailSteps";
import type { ApartmentFormState } from "./types";

function StepRegistrar({ def }: { def: StepDef }) {
  useApartmentStep(def.key, def.fields);
  return null;
}

function AllStepRegistrars() {
  return (
    <>
      {APT_STEPS.map((def) => (
        <StepRegistrar key={def.key} def={def} />
      ))}
    </>
  );
}

const COMPONENTS: Record<StepKey, ComponentType> = {
  identification: IdentificationStep,
  location: LocationStep,
  transaction: TransactionStep,
  general: GeneralStep,
  interior: InteriorStep,
  exterior: ExteriorStep,
  installations: InstallationsStep,
  energy: EnergyStep,
  finances: FinancesStep,
  equipments: EquipmentsStep,
  description: DescriptionStep,
  photos: PhotosStep,
};

type Props = {
  form: ApartmentFormState;
  savedForm: ApartmentFormState;
  setForm: React.Dispatch<React.SetStateAction<ApartmentFormState>>;
  persist: () => Promise<void>;
  residenceName: string;
  apartmentTitle: string;
};

function Shell({ residenceName, apartmentTitle }: { residenceName: string; apartmentTitle: string }) {
  const { residenceId, apartmentId } = useParams<{ residenceId: string; apartmentId?: string }>();
  const {
    dirtySteps, currentStep, setCurrentStep,
    saveCurrent, guardNavigation, currentIsDirty, isSaving,
  } = useWizardSave();
  const idx = Math.max(0, APT_STEPS.findIndex((s) => s.key === currentStep));
  const Step = COMPONENTS[APT_STEPS[idx].key];
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [currentStep]);

  const goToStep = (key: string) => guardNavigation(() => setCurrentStep(key));
  const goPrev = () =>
    guardNavigation(() => setCurrentStep(APT_STEPS[Math.max(0, idx - 1)].key));
  const goNext = () =>
    guardNavigation(() =>
      setCurrentStep(APT_STEPS[Math.min(APT_STEPS.length - 1, idx + 1)].key),
    );

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/partenaire" className="hover:text-foreground">Mon espace</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/edition`} className="hover:text-foreground">{residenceName}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/partenaire/residences/${residenceId}/appartements`} className="hover:text-foreground">Appartements</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Modifier</span>
      </nav>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl">{apartmentTitle || "Modifier l'appartement"}</h1>
        <div className="flex items-center gap-3">
          {dirtySteps.size > 0 && (
            <span className="text-sm text-orange-600 font-medium">
              {dirtySteps.size} modification{dirtySteps.size > 1 ? "s" : ""} non enregistrée{dirtySteps.size > 1 ? "s" : ""}
            </span>
          )}
          {apartmentId && (
            <Button variant="outline" asChild>
              <a href={`/appartements/${apartmentId}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" /> Aperçu
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Catégories" className="space-y-1">
          {APT_STEPS.map((s, i) => {
            const dirty = dirtySteps.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => goToStep(s.key)}
                className={`w-full text-left rounded-lg px-4 py-3 text-base transition-colors ${
                  i === idx ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
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

        <div ref={contentRef} className="space-y-6 scroll-mt-4">
          <Step />

          <div className="flex items-center justify-end gap-3">
            <Button
              size="lg"
              onClick={saveCurrent}
              disabled={!currentIsDirty || isSaving}
              className={currentIsDirty ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" disabled={idx === 0} onClick={goPrev}>
              Précédent
            </Button>
            <Button disabled={idx === APT_STEPS.length - 1} onClick={goNext}>
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApartmentEditorShell({
  form, savedForm, setForm, persist, residenceName, apartmentTitle,
}: Props) {
  const ctxValue = useMemo(
    () => ({ form, savedForm, setForm, persist }),
    [form, savedForm, setForm, persist],
  );

  return (
    <WizardSaveProvider
      initialStep="identification"
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
      <ApartmentFormProvider value={ctxValue}>
        <AllStepRegistrars />
        <Shell residenceName={residenceName} apartmentTitle={apartmentTitle} />
      </ApartmentFormProvider>
    </WizardSaveProvider>
  );
}
