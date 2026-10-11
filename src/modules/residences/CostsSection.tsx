import { UNIT_TYPES } from "@/modules/apartments/unitTypes";
import type { PublicUnitSummary } from "./publicApi";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  UNIT_TYPES.map((t) => [t.value, t.label]),
);

export type ResidenceCharge = {
  id: string;
  label: string;
  description: string | null;
  amount: number;
};

type Props = {
  charges: ResidenceCharge[];
  unitSummaries: PublicUnitSummary[];
};

export default function CostsSection({ charges, unitSummaries }: Props) {
  if (charges.length === 0 || unitSummaries.length === 0) return null;

  const mandatory = charges.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  const rentRows = unitSummaries.filter((s) => s.hasRent && s.rentMin);
  if (rentRows.length === 0) return null;

  const rows = rentRows.map((s) => {
    const rentMin = s.rentMin ?? 0;
    const totalMin = rentMin + mandatory;
    const totalMax = s.rentMax ? s.rentMax + mandatory : null;
    const hasRange = totalMax && totalMax > totalMin;
    return {
      type: s.type,
      label: TYPE_LABEL[s.type] ?? s.type,
      rent:
        s.rentMin === s.rentMax || !s.rentMax
          ? `${s.rentMin?.toLocaleString("fr-BE")} €`
          : `${s.rentMin?.toLocaleString("fr-BE")} – ${s.rentMax?.toLocaleString("fr-BE")} €`,
      charges: mandatory > 0 ? `${mandatory.toLocaleString("fr-BE")} €` : "—",
      totalMin: `${totalMin.toLocaleString("fr-BE")} €`,
      totalMax: hasRange ? `${totalMax!.toLocaleString("fr-BE")} €` : "—",
    };
  });

  return (
    <div>
      {charges.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-base">
            Charges &amp; services inclus pour tous les résidents
          </h3>
          <div className="space-y-2">
            {charges.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{c.label}</p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  )}
                </div>
                <span className="font-semibold text-sm whitespace-nowrap shrink-0">
                  {c.amount.toLocaleString("fr-BE")} €/mois
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 font-semibold">
              <span>Total charges obligatoires</span>
              <span className="whitespace-nowrap text-primary">{mandatory.toLocaleString("fr-BE")} €/mois</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3 text-base">
          Estimation du coût total par type de logement
        </h3>
        {/* Mobile: one card per type, the 5-column table does not fit */}
        <div className="space-y-3 sm:hidden">
          {rows.map((r) => (
            <div key={r.type} className="rounded-xl border border-border/60 p-4">
              <div className="mb-2 font-semibold">{r.label}</div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Loyer</dt>
                  <dd className="text-right">{r.rent}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Charges obligatoires</dt>
                  <dd className="text-right text-muted-foreground">{r.charges}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-medium text-primary">Total min / mois</dt>
                  <dd className="text-right font-bold text-primary">{r.totalMin}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Total max / mois</dt>
                  <dd className="text-right font-semibold text-muted-foreground">{r.totalMax}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-border/60 sm:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Loyer</th>
                <th className="px-4 py-3 text-right font-medium">Charges obligatoires</th>
                <th className="px-4 py-3 text-right font-medium text-primary">
                  Total min / mois
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Total max / mois
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.type} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{r.rent}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{r.charges}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary">{r.totalMin}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-muted-foreground">{r.totalMax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Le total minimum est calculé sur la base du loyer le moins cher + charges obligatoires.
          Le total maximum correspond au loyer le plus élevé du même type + charges obligatoires.
          Estimation indicative, à confirmer avec la résidence.
        </p>
      </div>
    </div>
  );
}
