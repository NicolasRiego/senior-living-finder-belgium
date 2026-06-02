import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";
import type { SavedApartment } from "./savedApartments";

export const SIMULATOR_MAX = 10;

async function loadAll(userId: string): Promise<SavedApartment[]> {
  const { data: rows, error } = await supabase
    .from("simulator_logements")
    .select("apartment_id, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  const ids = (rows ?? []).map((r) => r.apartment_id as string);
  if (ids.length === 0) return [];

  const { data: apts, error: aptErr } = await supabase
    .from("apartments")
    .select(
      "id, residence_id, type, surface_m2, sale_price, rent_price, transaction_type, residences:residences!inner(slug, nom_fr, ville)"
    )
    .in("id", ids);
  if (aptErr) {
    console.error(aptErr);
    return [];
  }

  const { data: photoRows } = await supabase
    .from("photos")
    .select("residence_id, storage_path, category, display_order")
    .in("residence_id", (apts ?? []).map((a: any) => a.residence_id))
    .order("display_order", { ascending: true });

  const coverByRes = new Map<string, string>();
  for (const p of photoRows ?? []) {
    const rid = (p as any).residence_id as string;
    if (!coverByRes.has(rid) || (p as any).category === "cover") {
      coverByRes.set(rid, (p as any).storage_path as string);
    }
  }

  const aptById = new Map<string, any>();
  for (const a of apts ?? []) aptById.set((a as any).id, a);

  return (rows ?? [])
    .map((sr) => {
      const a: any = aptById.get(sr.apartment_id as string);
      if (!a || !a.residences) return null;
      return {
        id: a.id,
        residence_id: a.residence_id,
        residence_slug: a.residences.slug,
        residence_nom_fr: a.residences.nom_fr,
        type: a.type,
        surface_m2: a.surface_m2,
        sale_price: a.sale_price,
        rent_price: a.rent_price,
        transaction_type: a.transaction_type,
        cover_path: coverByRes.get(a.residence_id) ?? null,
        ville: a.residences.ville,
        saved_at: sr.added_at as string,
      } as SavedApartment;
    })
    .filter((x): x is SavedApartment => x !== null);
}

let cache: SavedApartment[] = [];
const listeners = new Set<(v: SavedApartment[]) => void>();
function notify() {
  listeners.forEach((l) => l(cache));
}

export type AddResult = "ok" | "exists" | "full" | "error" | "no-user";

export async function addToSimulator(
  userId: string,
  apartmentId: string,
  options: { silent?: boolean } = {}
): Promise<AddResult> {
  // Pre-check count to avoid noisy toast on heart-save when full
  const { count } = await supabase
    .from("simulator_logements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= SIMULATOR_MAX) {
    if (!options.silent) {
      toast.warning(
        "Maximum 10 logements dans le simulateur. Retirez-en un pour en ajouter un nouveau."
      );
    }
    return "full";
  }
  const { error } = await supabase
    .from("simulator_logements")
    .insert({ user_id: userId, apartment_id: apartmentId });
  if (error) {
    if (error.code === "23505") return "exists";
    if (error.message?.includes("simulator_logements_max_reached")) {
      if (!options.silent) {
        toast.warning(
          "Maximum 10 logements dans le simulateur. Retirez-en un pour en ajouter un nouveau."
        );
      }
      return "full";
    }
    if (!options.silent) toast.error(error.message);
    return "error";
  }
  // Refresh cache
  cache = await loadAll(userId);
  notify();
  return "ok";
}

export function useSimulatorLogements() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedApartment[]>(cache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  useEffect(() => {
    if (!user) {
      cache = [];
      notify();
      setLoading(false);
      return;
    }
    setLoading(true);
    loadAll(user.id).then((v) => {
      cache = v;
      notify();
      setLoading(false);
    });
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    cache = await loadAll(user.id);
    notify();
  }, [user]);

  const remove = useCallback(
    async (apartmentId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("simulator_logements")
        .delete()
        .eq("user_id", user.id)
        .eq("apartment_id", apartmentId);
      if (error) return toast.error(error.message);
      cache = cache.filter((a) => a.id !== apartmentId);
      notify();
    },
    [user]
  );

  const add = useCallback(
    async (apartmentId: string) => {
      if (!user) return "no-user" as AddResult;
      return addToSimulator(user.id, apartmentId);
    },
    [user]
  );

  const has = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  return { items, loading, add, remove, has, refresh };
}
