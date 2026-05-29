import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type StepHandle = {
  isDirty: boolean;
  save: () => Promise<void>;
  reset: () => void;
};

type Ctx = {
  register: (key: string, handle: StepHandle) => void;
  unregister: (key: string) => void;
  dirtySteps: Set<string>;
  currentStep: string;
  setCurrentStep: (k: string) => void;
  saveCurrent: () => Promise<boolean>;
  guardNavigation: (next: () => void) => void;
  currentIsDirty: boolean;
  isSaving: boolean;
};

const WizardSaveContext = createContext<Ctx | null>(null);

export function WizardSaveProvider({
  children,
  initialStep,
  renderModal,
}: {
  children: ReactNode;
  initialStep: string;
  renderModal: (args: {
    open: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onStay: () => void;
  }) => ReactNode;
}) {
  const handles = useRef<Map<string, StepHandle>>(new Map());
  const [, force] = useState(0);
  const refresh = useCallback(() => force((n) => n + 1), []);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  const [pending, setPending] = useState<null | (() => void)>(null);

  const register = useCallback((key: string, handle: StepHandle) => {
    handles.current.set(key, handle);
    refresh();
  }, [refresh]);

  const unregister = useCallback((key: string) => {
    handles.current.delete(key);
    refresh();
  }, [refresh]);

  const dirtySteps = new Set<string>();
  handles.current.forEach((h, k) => { if (h.isDirty) dirtySteps.add(k); });

  const currentIsDirty = dirtySteps.has(currentStep);

  const saveCurrent = useCallback(async () => {
    const h = handles.current.get(currentStep);
    if (!h || !h.isDirty) return true;
    setIsSaving(true);
    try {
      await h.save();
      toast.success("Modifications enregistrées ✓");
      refresh();
      return true;
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde. Veuillez réessayer.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, refresh]);

  const guardNavigation = useCallback((next: () => void) => {
    const h = handles.current.get(currentStep);
    if (!h || !h.isDirty) { next(); return; }
    setPending(() => next);
  }, [currentStep]);

  // beforeunload
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      let dirty = false;
      handles.current.forEach((h) => { if (h.isDirty) dirty = true; });
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const value: Ctx = {
    register, unregister, dirtySteps, currentStep, setCurrentStep,
    saveCurrent, guardNavigation, currentIsDirty, isSaving,
  };

  return (
    <WizardSaveContext.Provider value={value}>
      {children}
      {renderModal({
        open: pending !== null,
        onSave: async () => {
          const ok = await saveCurrent();
          if (ok && pending) { pending(); }
          setPending(null);
        },
        onDiscard: () => {
          const h = handles.current.get(currentStep);
          h?.reset();
          refresh();
          if (pending) pending();
          setPending(null);
        },
        onStay: () => setPending(null),
      })}
    </WizardSaveContext.Provider>
  );
}

export function useWizardSave() {
  const ctx = useContext(WizardSaveContext);
  if (!ctx) throw new Error("useWizardSave must be used inside WizardSaveProvider");
  return ctx;
}

/**
 * Step registers its dirty state + save/reset handlers with the wizard shell.
 * Re-registers when isDirty/save/reset references change.
 */
export function useRegisterWizardStep(key: string, handle: StepHandle) {
  const ctx = useContext(WizardSaveContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.register(key, handle);
    return () => ctx.unregister(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle.isDirty, handle.save, handle.reset]);
}
