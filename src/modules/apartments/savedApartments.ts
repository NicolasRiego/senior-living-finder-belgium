import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { openLoginGate } from "@/modules/auth/loginGate";
import { toast } from "sonner";

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

type RawRow = {
  apartment_id: string;
  created_at: string;
  apartments: {
    id: string;
    residence_id: string;
    type: string | null;
    surface_m2: number | null;
    sale_price: number | null;
    rent_price: number | null;
    transaction_type: string | null;
    residences: {
      slug: string;
      nom_fr: string;
      ville: string | null;
    } | null;
  } | null;
};


async function loadAll(userId: string): Promise<SavedApartment[]> {
  const { data: savedRows, error: savedErr } = await supabase
    .from("saved_apartments")
    .select("apartment_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (savedErr) {
    console.error(savedErr);
    return [];
  }
  const ids = (savedRows ?? []).map((r) => r.apartment_id as string);
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

  return (savedRows ?? [])
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
        saved_at: sr.created_at as string,
      } as SavedApartment;
    })
    .filter((x): x is SavedApartment => x !== null);
}


let cache: SavedApartment[] = [];
const listeners = new Set<(v: SavedApartment[]) => void>();
function notify() {
  listeners.forEach((l) => l(cache));
}

export function useSavedApartments() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedApartment[]>(cache);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      cache = [];
      notify();
      return;
    }
    loadAll(user.id).then((v) => {
      cache = v;
      notify();
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
        .from("saved_apartments")
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
    async (apt: Omit<SavedApartment, "saved_at">) => {
      if (!user) {
        openLoginGate({
          title: "Connectez-vous pour enregistrer ce logement",
          description:
            "Créez un compte ou connectez-vous pour retrouver vos logements enregistrés dans Mon espace.",
        });
        return;
      }
      const { error } = await supabase
        .from("saved_apartments")
        .insert({ user_id: user.id, apartment_id: apt.id });
      if (error && error.code !== "23505") return toast.error(error.message);
      cache = [{ ...apt, saved_at: new Date().toISOString() }, ...cache.filter((a) => a.id !== apt.id)];
      notify();
      toast.success("Logement enregistré");
    },
    [user]
  );

  const has = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  return { items, remove, add, has, refresh };
}
