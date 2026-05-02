import { describe, it, expect } from "vitest";
import {
  computeLeadScore,
  scoreBudget,
  scoreTiming,
  scoreCompleteness,
} from "@/modules/leads/scoring";

describe("lead scoring", () => {
  it("budget perfect match → 50", () => {
    expect(scoreBudget({ budget_min: 1500, budget_max: 2500, reference_price: 2000 })).toBe(50);
  });

  it("budget within tolerance ±15% → 35", () => {
    expect(scoreBudget({ budget_min: 1500, budget_max: 1800, reference_price: 2000 })).toBe(35);
  });

  it("budget far off → 5", () => {
    expect(scoreBudget({ budget_min: 800, budget_max: 1000, reference_price: 3500 })).toBe(5);
  });

  it("budget unknown reference but provided → 30", () => {
    expect(scoreBudget({ budget_min: 1500, budget_max: 2500, reference_price: null })).toBe(30);
  });

  it("timing immediat → 25, info → 5, null → 0", () => {
    expect(scoreTiming("immediat")).toBe(25);
    expect(scoreTiming("info")).toBe(5);
    expect(scoreTiming(null)).toBe(0);
  });

  it("completeness caps at 25", () => {
    expect(
      scoreCompleteness({
        contact_name: "Jean",
        contact_email: "j@example.com",
        contact_phone: "0470000000",
        for_whom: "parent",
        region_target: "Bruxelles",
        autonomy_level: "GIR4",
        message: "Bonjour, je cherche…",
      }),
    ).toBe(25);
  });

  it("computes total in [0,100] with weights 50/25/25", () => {
    const score = computeLeadScore({
      budget_min: 1800, budget_max: 2200, reference_price: 2000,
      timing: "immediat",
      contact_name: "Jean", contact_email: "j@example.com", contact_phone: "0470000000",
      for_whom: "parent", region_target: "BXL", autonomy_level: "GIR4",
      message: "Bonjour, je cherche une résidence proche du centre.",
    });
    // 50 + 25 + 25 = 100
    expect(score).toBe(100);
  });

  it("low quality lead scores low", () => {
    const score = computeLeadScore({
      budget_min: null, budget_max: null, reference_price: 2000,
      timing: null,
      contact_email: "x@y.z",
    });
    expect(score).toBeLessThan(15);
  });
});
