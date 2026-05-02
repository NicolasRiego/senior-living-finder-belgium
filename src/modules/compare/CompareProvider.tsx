import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const MAX = 4;
const STORAGE_KEY = "sc_compare_ids";

type CompareCtx = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
  setIds: (ids: string[]) => void;
};

const Ctx = createContext<CompareCtx | null>(null);

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>(() => readStorage());

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIdsState(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = (id: string) =>
    setIdsState((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : curr.length >= MAX ? curr : [...curr, id],
    );
  const remove = (id: string) => setIdsState((c) => c.filter((x) => x !== id));
  const clear = () => setIdsState([]);
  const has = (id: string) => ids.includes(id);
  const setIds = (next: string[]) => setIdsState(Array.from(new Set(next)).slice(0, MAX));

  return (
    <Ctx.Provider value={{ ids, toggle, remove, clear, has, isFull: ids.length >= MAX, setIds }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCompare must be used within CompareProvider");
  return c;
}
