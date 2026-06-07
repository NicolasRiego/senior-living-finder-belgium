import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export const COMPARE_FULL_MSG_RES =
  "Vous avez atteint le maximum de 4 résidences comparées. Rendez-vous dans le Comparateur pour en supprimer avant d'en ajouter de nouvelles.";
export const COMPARE_FULL_MSG_APT =
  "Vous avez atteint le maximum de 4 logements comparés. Rendez-vous dans le Comparateur pour en supprimer avant d'en ajouter de nouveaux.";
export const COMPARE_FULL_TIP_RES = "Limite de 4 résidences comparées atteinte";
export const COMPARE_FULL_TIP_APT = "Limite de 4 logements comparés atteinte";

const MAX = 4;
const STORAGE_KEY_RES = "sc_compare_ids";
const STORAGE_KEY_APT = "sc_compare_apt_ids";

type CompareCtx = {
  // Résidences (existant)
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
  setIds: (ids: string[]) => void;
  // Appartements (nouveau)
  aptIds: string[];
  toggleApt: (id: string) => void;
  removeApt: (id: string) => void;
  clearApt: () => void;
  hasApt: (id: string) => boolean;
  isAptFull: boolean;
};

const Ctx = createContext<CompareCtx | null>(null);

function readStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>(() => readStorage(STORAGE_KEY_RES));
  const [aptIds, setAptIdsState] = useState<string[]>(() => readStorage(STORAGE_KEY_APT));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RES, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APT, JSON.stringify(aptIds));
    } catch {
      /* ignore */
    }
  }, [aptIds]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_RES) setIdsState(readStorage(STORAGE_KEY_RES));
      if (e.key === STORAGE_KEY_APT) setAptIdsState(readStorage(STORAGE_KEY_APT));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Résidences
  const toggle = (id: string) =>
    setIdsState((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : curr.length >= MAX ? curr : [...curr, id],
    );
  const remove = (id: string) => setIdsState((c) => c.filter((x) => x !== id));
  const clear = () => setIdsState([]);
  const has = (id: string) => ids.includes(id);
  const setIds = (next: string[]) => setIdsState(Array.from(new Set(next)).slice(0, MAX));

  // Appartements
  const toggleApt = (id: string) =>
    setAptIdsState((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : curr.length >= MAX ? curr : [...curr, id],
    );
  const removeApt = (id: string) => setAptIdsState((c) => c.filter((x) => x !== id));
  const clearApt = () => setAptIdsState([]);
  const hasApt = (id: string) => aptIds.includes(id);

  return (
    <Ctx.Provider
      value={{
        ids,
        toggle,
        remove,
        clear,
        has,
        isFull: ids.length >= MAX,
        setIds,
        aptIds,
        toggleApt,
        removeApt,
        clearApt,
        hasApt,
        isAptFull: aptIds.length >= MAX,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCompare must be used within CompareProvider");
  return c;
}
