import { TYPE_LABEL } from "@/modules/apartments/unitTypes";
import type { PublicUnitSummary } from "./publicApi";

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
              <span className="text-primary">{mandatory.toLocaleString("fr-BE")} €/mois</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3 text-base">
          Estimation du coût total par type de logement
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Loyer</th>
                <th className="px-4 py-3 text-right font-medium">Charges obligatoires</th>
                <th className="px-4 py-3 text-right font-medium text-primary">
                  Total min / mois
                </th>
              </tr>
            </thead>
            <tbody>
              {rentRows.map((s, i) => {
                const rentMin = s.rentMin ?? 0;
                const total = rentMin + mandatory;
                return (
                  <tr key={s.type} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-4 py-3 font-medium">{TYPE_LABEL[s.type] ?? s.type}</td>
                    <td className="px-4 py-3 text-right">
                      {s.rentMin === s.rentMax || !s.rentMax
                        ? `${s.rentMin?.toLocaleString("fr-BE")} €`
                        : `${s.rentMin?.toLocaleString("fr-BE")} – ${s.rentMax?.toLocaleString("fr-BE")} €`}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {mandatory > 0 ? `${mandatory.toLocaleString("fr-BE")} €` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {total.toLocaleString("fr-BE")} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Estimation indicative basée sur le loyer minimum de chaque type de logement + charges
          obligatoires. À confirmer avec la résidence.
        </p>
      </div>
    </div>
  );
}
