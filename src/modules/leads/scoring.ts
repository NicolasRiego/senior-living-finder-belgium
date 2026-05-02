/**
 * Lead scoring helper — mirrors the server-side weighting used by submit_lead().
 * Weights: Budget 50 / Timing 25 / Completeness 25 → max 100.
 *
 * Kept as a pure function so it can be unit tested and re-used in client previews.
 */

export type LeadScoreInput = {
  budget_min?: number | null;
  budget_max?: number | null;
  /** Reference monthly price for the residence ("from" price). */
  reference_price?: number | null;
  timing?: "immediat" | "3_mois" | "6_mois" | "12_mois" | "info" | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  for_whom?: string | null;
  region_target?: string | null;
  autonomy_level?: string | null;
  message?: string | null;
};

const TIMING_POINTS: Record<NonNullable<LeadScoreInput["timing"]>, number> = {
  immediat: 25,
  "3_mois": 20,
  "6_mois": 15,
  "12_mois": 10,
  info: 5,
};

export function scoreBudget({
  budget_min, budget_max, reference_price,
}: Pick<LeadScoreInput, "budget_min" | "budget_max" | "reference_price">): number {
  // No reference → unknown but lead provided a budget → 30, else 0
  if (reference_price == null) {
    return budget_min != null || budget_max != null ? 30 : 0;
  }
  if (budget_min == null && budget_max == null) return 0;

  const min = budget_min ?? 0;
  const max = budget_max ?? Number.POSITIVE_INFINITY;

  if (reference_price >= min && reference_price <= max) return 50; // perfect match
  // Within ±15% → 35
  const tol = reference_price * 0.15;
  if (reference_price >= min - tol && reference_price <= max + tol) return 35;
  // Within ±30% → 20
  const wide = reference_price * 0.3;
  if (reference_price >= min - wide && reference_price <= max + wide) return 20;
  return 5;
}

export function scoreTiming(timing: LeadScoreInput["timing"]): number {
  if (!timing) return 0;
  return TIMING_POINTS[timing] ?? 0;
}

export function scoreCompleteness(input: LeadScoreInput): number {
  // 25 max — 5 points per filled non-trivial field, capped.
  const fields: Array<unknown> = [
    input.contact_name,
    input.contact_email,
    input.contact_phone,
    input.for_whom,
    input.region_target,
    input.autonomy_level,
    input.message && input.message.length >= 10 ? input.message : null,
  ];
  const filled = fields.filter((v) => v != null && String(v).trim() !== "").length;
  return Math.min(25, filled * 4); // 7 fields * 4 ≈ 28 → cap 25
}

export function computeLeadScore(input: LeadScoreInput): number {
  const total = scoreBudget(input) + scoreTiming(input.timing) + scoreCompleteness(input);
  return Math.max(0, Math.min(100, Math.round(total)));
}
