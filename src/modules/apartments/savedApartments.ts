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

async function fetchCover(apartmentId: string): Promise<string | null> {
  const { data } = await supabase
    .from("photos")
    .select("storage_path, residence_id")
    .eq("category", "cover")
    .limit(1)
    .maybeSingle();
  return data?.storage_path ?? null;
}

async function loadAll(userId: string): Promise<SavedApartment[]> {
  const { data, error } = await supabase
    .from("saved_apartments")
    .select(
      "apartment_id, created_at, apartments:apartments(id, residence_id, type, surface_m2, sale_price, rent_price, transaction_type, residences:residences(slug, nom_fr, ville))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  const rows = (data ?? []) as unknown as RawRow[];
  return rows
    .filter((r) => r.apartments && r.apartments.residences)
    .map((r) => ({
      id: r.apartments!.id,
      residence_id: r.apartments!.residence_id,
      residence_slug: r.apartments!.residences!.slug,
      residence_nom_fr: r.apartments!.residences!.nom_fr,
      type: r.apartments!.type,
      surface_m2: r.apartments!.surface_m2,
      sale_price: r.apartments!.sale_price,
      rent_price: r.apartments!.rent_price,
      transaction_type: r.apartments!.transaction_type,
      cover_path: null,
      ville: r.apartments!.residences!.ville,
      saved_at: r.created_at,
    }));
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
