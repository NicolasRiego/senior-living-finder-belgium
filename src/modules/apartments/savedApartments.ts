import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "saved_apartments";

export type SavedApartment = {
  id: string;
  residence_id: string;
  residence_slug: string;
  residence_nom_fr: string;
  type: string | null;
  surface_m2: number | null;
  sale_price: number | null;
  rent_price: number | null;
  transaction_type: string | null;
  cover_path: string | null;
  ville: string | null;
  saved_at: string;
};

function read(): SavedApartment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedApartment[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedApartment[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("saved_apartments:changed"));
  } catch {
    /* ignore */
  }
}

export function useSavedApartments() {
  const [items, setItems] = useState<SavedApartment[]>(() => read());

  useEffect(() => {
    const handler = () => setItems(read());
    window.addEventListener("saved_apartments:changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("saved_apartments:changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  const add = useCallback((apt: Omit<SavedApartment, "saved_at">) => {
    const cur = read();
    if (cur.some((a) => a.id === apt.id)) return;
    write([{ ...apt, saved_at: new Date().toISOString() }, ...cur]);
  }, []);

  const has = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  return { items, remove, add, has };
}
