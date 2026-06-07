import { supabase } from "@/integrations/supabase/client";
import { getCoverUrl } from "@/modules/residences/publicApi";

const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800";


export type CompareAptItem = {
  id: string;
  title_fr: string | null;
  type: string;
  surface_m2: number | null;
  floor: number | null;
  transaction_type: string;
  rent_price: number | null;
  sale_price: number | null;
  charges_monthly: number | null;
  parking: boolean;
  cave: boolean;
  terrace: boolean;
  garden: boolean;
  furnished: boolean;
  kitchen_equipped: boolean;
  elevator: boolean;
  wheelchair_accessible: boolean;
  status: string;
  available_from: string | null;
  residence_id: string;
  residence_nom_fr: string;
  residence_ville: string;
  residence_slug: string;
  cover_url: string | null;
  additional_charges: { label: string; amount: number }[];
};

export async function fetchCompareApartments(ids: string[]): Promise<CompareAptItem[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("apartments")
    .select(
      `
      id, title_fr, type, surface_m2, floor,
      transaction_type, rent_price, sale_price,
      charges_monthly, parking, cave, terrace,
      garden, furnished, kitchen_equipped,
      elevator, wheelchair_accessible,
      status, available_from, residence_id,
      residences!inner(nom_fr, ville, slug)
    `,
    )
    .in("id", ids);

  const residenceIds = Array.from(
    new Set((data ?? []).map((a: Record<string, unknown>) => a.residence_id as string)),
  );

  // Fetch cover photos for each residence (cover first, else first by display_order)
  const coverMap = new Map<string, string>();
  if (residenceIds.length) {
    const { data: photos } = await supabase
      .from("photos")
      .select("residence_id, storage_path, category, display_order")
      .in("residence_id", residenceIds)
      .order("display_order", { ascending: true });
    for (const p of photos ?? []) {
      const rid = p.residence_id as string;
      const isCover = p.category === "cover";
      if (isCover || !coverMap.has(rid)) {
        coverMap.set(rid, p.storage_path as string);
      }
    }
  }

  const items = await Promise.all(
    (data ?? []).map(async (a: Record<string, unknown>) => {
      const residence = (a.residences ?? {}) as { nom_fr?: string; ville?: string; slug?: string };
      const residenceId = a.residence_id as string;
      const path = coverMap.get(residenceId) ?? null;
      const signed = path ? await getCoverUrl(path) : null;
      return {
        id: a.id as string,
        title_fr: (a.title_fr as string | null) ?? null,
        type: (a.type as string) ?? "",
        surface_m2: (a.surface_m2 as number | null) ?? null,
        floor: (a.floor as number | null) ?? null,
        transaction_type: (a.transaction_type as string) ?? "rent",
        rent_price: (a.rent_price as number | null) ?? null,
        sale_price: (a.sale_price as number | null) ?? null,
        charges_monthly: (a.charges_monthly as number | null) ?? null,
        parking: Boolean(a.parking),
        cave: Boolean(a.cave),
        terrace: Boolean(a.terrace),
        garden: Boolean(a.garden),
        furnished: Boolean(a.furnished),
        kitchen_equipped: Boolean(a.kitchen_equipped),
        elevator: Boolean(a.elevator),
        wheelchair_accessible: Boolean(a.wheelchair_accessible),
        status: (a.status as string) ?? "available",
        available_from: (a.available_from as string | null) ?? null,
        residence_id: residenceId,
        residence_nom_fr: residence.nom_fr ?? "",
        residence_ville: residence.ville ?? "",
        residence_slug: residence.slug ?? "",
        cover_url: signed ?? PEXELS_FALLBACK,
      };
    }),
  );

  return items;

}
