import { createContext, useContext, useCallback, type Dispatch, type SetStateAction } from "react";
import { useRegisterWizardStep } from "@/modules/partner/WizardSaveContext";
import type { ApartmentFormState } from "./types";

type AptFormCtx = {
  form: ApartmentFormState;
  savedForm: ApartmentFormState;
  setForm: Dispatch<SetStateAction<ApartmentFormState>>;
  persist: () => Promise<void>;
};

const Ctx = createContext<AptFormCtx | null>(null);

export function ApartmentFormProvider({
  value, children,
}: { value: AptFormCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAptForm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAptForm outside ApartmentFormProvider");
  return ctx;
}

/**
 * Tries to use the form context. Returns null if outside provider
 * (so step components can be reused in the legacy new-apartment form).
 */
export function useOptionalAptForm() {
  return useContext(Ctx);
}

/**
 * Registers a step's dirty/save/reset with the wizard save context,
 * scoped to a subset of fields owned by that step.
 * No-op when used outside ApartmentFormProvider.
 */
export function useApartmentStep(
  stepKey: string,
  fields: ReadonlyArray<keyof ApartmentFormState>,
) {
  const ctx = useContext(Ctx);
  // Stable handle references for the registration hook.
  const isDirty = !!ctx && fields.some((f) => ctx.form[f] !== ctx.savedForm[f]);
  const save = useCallback(async () => {
    if (!ctx) return;
    await ctx.persist();
  }, [ctx]);
  const reset = useCallback(() => {
    if (!ctx) return;
    ctx.setForm((f) => {
      const next = { ...f } as ApartmentFormState;
      for (const k of fields) {
        (next as unknown as Record<string, unknown>)[k as string] =
          (ctx.savedForm as unknown as Record<string, unknown>)[k as string];
      }
      return next;
    });
  }, [ctx, fields]);
  useRegisterWizardStep(stepKey, { isDirty, save, reset });
}
