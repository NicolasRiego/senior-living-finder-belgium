import { createContext, useContext, useState, type ReactNode } from "react";

const MAX = 4;

type CompareCtx = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
};

const Ctx = createContext<CompareCtx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : curr.length >= MAX ? curr : [...curr, id],
    );
  const remove = (id: string) => setIds((c) => c.filter((x) => x !== id));
  const clear = () => setIds([]);
  const has = (id: string) => ids.includes(id);

  return (
    <Ctx.Provider value={{ ids, toggle, remove, clear, has, isFull: ids.length >= MAX }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCompare must be used within CompareProvider");
  return c;
}
