import { Label } from "@/components/ui/label";

export type QualifyState = {
  for_whom: string;
  region_target: string;
  budget_range: string;
  budget_max: number | null;
  timing: string;
  autonomy_level: string;
};

export const EMPTY_QUALIFY: QualifyState = {
  for_whom: "", region_target: "", budget_range: "", budget_max: null, timing: "", autonomy_level: "",
};

const FOR_WHOM = [
  { value: "self", label: "Pour moi" },
  { value: "parent", label: "Pour un parent" },
  { value: "other", label: "Pour un proche" },
];
const REGIONS = ["Bruxelles", "Wallonie", "Flandre"];
const BUDGET_RANGES = [
  { value: "<1500", label: "Moins de 1 500 €", max: 1500 },
  { value: "1500_2000", label: "1 500 – 2 000 €", max: 2000 },
  { value: "2000_2500", label: "2 000 – 2 500 €", max: 2500 },
  { value: "2500_3000", label: "2 500 – 3 000 €", max: 3000 },
  { value: ">3000", label: "Plus de 3 000 €", max: 5000 },
];
const TIMINGS = [
  { value: "immediate", label: "Immédiat (< 1 mois)" },
  { value: "1_3_months", label: "1 à 3 mois" },
  { value: "3_6_months", label: "3 à 6 mois" },
  { value: "6_12_months", label: "6 à 12 mois" },
  { value: "later", label: "Plus tard / je m'informe" },
];
const AUTONOMY = [
  { value: "autonomous", label: "Autonome" },
  { value: "light_help", label: "Aide légère" },
  { value: "regular_care", label: "Soins réguliers" },
  { value: "heavy_care", label: "Dépendance importante" },
];

type Props = { value: QualifyState; onChange: (v: QualifyState) => void };

export function QualifyFields({ value, onChange }: Props) {
  const set = <K extends keyof QualifyState>(k: K, v: QualifyState[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <Row label="Pour qui ?">
        <Chips value={value.for_whom} onChange={(v) => set("for_whom", v)} options={FOR_WHOM} />
      </Row>
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Région ciblée">
          <Native value={value.region_target} onChange={(v) => set("region_target", v)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Native>
        </Row>
        <Row label="Budget mensuel">
          <Native
            value={value.budget_range}
            onChange={(v) => {
              const range = BUDGET_RANGES.find((b) => b.value === v);
              onChange({ ...value, budget_range: v, budget_max: range?.max ?? null });
            }}
          >
            {BUDGET_RANGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </Native>
        </Row>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Échéance">
          <Native value={value.timing} onChange={(v) => set("timing", v)}>
            {TIMINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Native>
        </Row>
        <Row label="Autonomie">
          <Native value={value.autonomy_level} onChange={(v) => set("autonomy_level", v)}>
            {AUTONOMY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Native>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><Label className="mb-1 block text-xs">{label}</Label>{children}</div>);
}
function Native({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>{children}
    </select>
  );
}
function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={"rounded-full border px-3 py-1 text-xs transition " + (value === o.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
