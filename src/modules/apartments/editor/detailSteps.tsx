import {
  GeneralSection, InteriorSection, ExteriorSection,
  InstallationsSection, EnergySection, FinancesExtraSection,
} from "./sections";
import { useAptForm } from "./ApartmentFormContext";
import type { ApartmentFormState } from "./types";
import PebCertificate from "./PebCertificate";

function useFormSetter() {
  const { form, setForm } = useAptForm();
  const set = <K extends keyof ApartmentFormState>(k: K, v: ApartmentFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  return { form, set };
}

export function GeneralStep() {
  const { form, set } = useFormSetter();
  return <GeneralSection form={form} set={set} />;
}
export function InteriorStep() {
  const { form, set } = useFormSetter();
  return <InteriorSection form={form} set={set} />;
}
export function ExteriorStep() {
  const { form, set } = useFormSetter();
  return <ExteriorSection form={form} set={set} />;
}
export function InstallationsStep() {
  const { form, set } = useFormSetter();
  return <InstallationsSection form={form} set={set} />;
}
export function EnergyStep() {
  const { form, set } = useFormSetter();
  return (
    <div className="space-y-6">
      <EnergySection form={form} set={set} />
      <PebCertificate />
    </div>
  );
}
export function FinancesStep() {
  const { form, set } = useFormSetter();
  return <FinancesExtraSection form={form} set={set} />;
}
