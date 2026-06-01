import {
  GeneralSection, InteriorSection, ExteriorSection,
  InstallationsSection, EnergySection, FinancesExtraSection,
} from "./sections";
import { useAptForm, useApartmentStep } from "./ApartmentFormContext";
import { APT_STEPS } from "./stepDefs";
import type { ApartmentFormState } from "./types";

function useStepFor(key: string) {
  const def = APT_STEPS.find((s) => s.key === key)!;
  useApartmentStep(def.key, def.fields);
  const { form, setForm } = useAptForm();
  const set = <K extends keyof ApartmentFormState>(k: K, v: ApartmentFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  return { form, set };
}

export function GeneralStep() {
  const { form, set } = useStepFor("general");
  return <GeneralSection form={form} set={set} />;
}
export function InteriorStep() {
  const { form, set } = useStepFor("interior");
  return <InteriorSection form={form} set={set} />;
}
export function ExteriorStep() {
  const { form, set } = useStepFor("exterior");
  return <ExteriorSection form={form} set={set} />;
}
export function InstallationsStep() {
  const { form, set } = useStepFor("installations");
  return <InstallationsSection form={form} set={set} />;
}
export function EnergyStep() {
  const { form, set } = useStepFor("energy");
  return <EnergySection form={form} set={set} />;
}
export function FinancesStep() {
  const { form, set } = useStepFor("finances");
  return <FinancesExtraSection form={form} set={set} />;
}
