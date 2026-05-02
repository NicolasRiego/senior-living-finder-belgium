import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr, type Dict } from "./locales/fr";
import { nl } from "./locales/nl";

export type Locale = "fr" | "nl";

const dictionaries: Record<Locale, Dict> = { fr, nl };
const STORAGE_KEY = "serenia.locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** Returns the localized value for a fr/nl pair, falling back to the other locale or empty string. */
  tr: (fr: string | null | undefined, nl: string | null | undefined) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function resolve(dict: Dict, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "fr" || stored === "nl") return stored;
    const browser = navigator.language.toLowerCase();
    return browser.startsWith("nl") ? "nl" : "fr";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = (path: string, vars?: Record<string, string | number>) => {
    let str = resolve(dictionaries[locale], path);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  };

  const tr = (frVal: string | null | undefined, nlVal: string | null | undefined): string => {
    if (locale === "nl") return (nlVal ?? frVal ?? "") as string;
    return (frVal ?? nlVal ?? "") as string;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleState, t, tr }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
