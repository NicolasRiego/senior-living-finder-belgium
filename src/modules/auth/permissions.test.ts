import { describe, it, expect } from "vitest";

/**
 * Mirrors the access-control logic enforced server-side by RLS on `residences`:
 *   - admins see everything
 *   - org members see their own residences (any status)
 *   - public sees only published residences
 *
 * This pure helper is what we rely on in the UI to gate "edit" / "preview" buttons.
 */
export function canViewResidence(opts: {
  isAdmin: boolean;
  orgIds: string[];
  residence: { org_id: string; status: "draft" | "in_review" | "published" | "archived" };
}): boolean {
  if (opts.isAdmin) return true;
  if (opts.orgIds.includes(opts.residence.org_id)) return true;
  return opts.residence.status === "published";
}

export function canManageResidence(opts: {
  isAdmin: boolean;
  orgIds: string[];
  residence: { org_id: string };
}): boolean {
  return opts.isAdmin || opts.orgIds.includes(opts.residence.org_id);
}

describe("residence permissions (mirror of RLS)", () => {
  const draft = { org_id: "org-1", status: "draft" as const };
  const published = { org_id: "org-1", status: "published" as const };

  it("admin can view any residence", () => {
    expect(canViewResidence({ isAdmin: true, orgIds: [], residence: draft })).toBe(true);
  });
  it("org member can view own draft", () => {
    expect(canViewResidence({ isAdmin: false, orgIds: ["org-1"], residence: draft })).toBe(true);
  });
  it("public cannot view drafts", () => {
    expect(canViewResidence({ isAdmin: false, orgIds: [], residence: draft })).toBe(false);
  });
  it("public can view published", () => {
    expect(canViewResidence({ isAdmin: false, orgIds: [], residence: published })).toBe(true);
  });

  it("only admin or org member can manage", () => {
    expect(canManageResidence({ isAdmin: false, orgIds: [], residence: published })).toBe(false);
    expect(canManageResidence({ isAdmin: true, orgIds: [], residence: published })).toBe(true);
    expect(canManageResidence({ isAdmin: false, orgIds: ["org-1"], residence: published })).toBe(true);
  });
});
