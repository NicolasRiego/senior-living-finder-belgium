import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/modules/i18n/I18nProvider";

function wrap({ children }: { children: React.ReactNode }) {
  // Reset stored locale to keep tests deterministic
  if (typeof window !== "undefined") window.localStorage.removeItem("serenia.locale");
  return <I18nProvider>{children}</I18nProvider>;
}

describe("i18n tr() helper (residence content mapping)", () => {
  it("returns FR value by default", () => {
    const { result } = renderHook(() => useI18n(), { wrapper: wrap });
    act(() => result.current.setLocale("fr"));
    expect(result.current.tr("Bonjour", "Hallo")).toBe("Bonjour");
  });

  it("returns NL when locale is NL", () => {
    const { result } = renderHook(() => useI18n(), { wrapper: wrap });
    act(() => result.current.setLocale("nl"));
    expect(result.current.tr("Bonjour", "Hallo")).toBe("Hallo");
  });

  it("falls back to the other locale when one is missing", () => {
    const { result } = renderHook(() => useI18n(), { wrapper: wrap });
    act(() => result.current.setLocale("nl"));
    expect(result.current.tr("Bonjour", null)).toBe("Bonjour");
    act(() => result.current.setLocale("fr"));
    expect(result.current.tr(null, "Hallo")).toBe("Hallo");
  });

  it("returns empty string when both are missing", () => {
    const { result } = renderHook(() => useI18n(), { wrapper: wrap });
    expect(result.current.tr(null, null)).toBe("");
    expect(result.current.tr(undefined, undefined)).toBe("");
  });
});
