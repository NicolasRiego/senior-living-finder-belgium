import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type FontSize = "normal" | "large" | "xlarge";

const STORAGE_KEY = "app.fontSize";

export const FONT_SIZE_PX: Record<FontSize, string> = {
  normal: "18px",
  large: "21px",
  xlarge: "24px",
};

interface FontSizeContextValue {
  size: FontSize;
  setSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextValue | undefined>(undefined);

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
