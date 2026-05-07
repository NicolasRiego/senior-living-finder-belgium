import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type FontSize = "normal" | "large" | "xlarge";

const STORAGE_KEY = "app.fontSize";

const SIZE_TO_PX: Record<FontSize, string> = {
  normal: "16px",
  large: "19px",
  xlarge: "22px",
};

interface FontSizeContextValue {
  size: FontSize;
  setSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextValue | undefined>(undefined);

function applySize(size: FontSize): void {
  const root = document.documentElement;
  root.setAttribute("data-fontsize", size);
  root.style.fontSize = SIZE_TO_PX[size];
}

function readInitial(): FontSize {
  if (typeof window === "undefined") return "normal";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "normal" || stored === "large" || stored === "xlarge") return stored;
  return "normal";
}

interface FontSizeProviderProps {
  children: ReactNode;
}

export function FontSizeProvider({ children }: FontSizeProviderProps) {
  const [size, setSizeState] = useState<FontSize>(readInitial);

  useEffect(() => {
    applySize(size);
    try {
      window.localStorage.setItem(STORAGE_KEY, size);
    } catch {
      /* ignore */
    }
  }, [size]);

  const setSize = useCallback((next: FontSize) => setSizeState(next), []);

  return (
    <FontSizeContext.Provider value={{ size, setSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize(): FontSizeContextValue {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}
