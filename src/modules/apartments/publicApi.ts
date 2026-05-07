import { supabase } from "@/integrations/supabase/client";
import type { ApartmentFilters, ApartmentSearchRow } from "./types";
import { APT_BOOL_FIELDS } from "./types";

export async function searchApartments(filters: ApartmentFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("apartment_search_view" as never)
    .select("*", { count: "exact" })
    .eq("status", "available");

  // Transaction filter
  if (filters.tx === "sale") {
    q = q.in("transaction_type", ["sale", "both"]);
  } else if (filters.tx === "rent") {
    q = q.in("transaction_type", ["rent", "both"]);
  }

  if (filters.code_postal) q = q.ilike("code_postal", `${filters.code_postal}%`);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.surface_min) q = q.gte("surface_m2", filters.surface_min);

  if (filters.tx !== "rent" && filters.sale_max) q = q.lte("sale_price", filters.sale_max);
  if (filters.tx !== "sale" && filters.rent_max) q = q.lte("rent_price", filters.rent_max);

  for (const f of APT_BOOL_FIELDS) {
    if (filters[f]) q = q.eq(f, true);
  }

  if (filters.residence_ids && filters.residence_ids.length > 0) {
    q = q.in("residence_id", filters.residence_ids);
  }

  const sort = filters.sort ?? "price_asc";
  const priceCol = filters.tx === "sale" ? "sale_price" : "rent_price";
  if (sort === "price_asc") {
    q = q.order(priceCol as never, { ascending: true, nullsFirst: false });
  } else if (sort === "price_desc") {
    q = q.order(priceCol as never, { ascending: false, nullsFirst: false });
  } else if (sort === "surface_asc") {
    q = q.order("surface_m2" as never, { ascending: true, nullsFirst: false });
  } else {
    q = q.order("surface_m2" as never, { ascending: false, nullsFirst: false });
  }
  q = q.order("id" as never, { ascending: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as ApartmentSearchRow[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export type ResidenceFacet = { id: string; nom_fr: string; nom_nl: string | null; ville: string | null };

export async function listApartmentResidences(): Promise<ResidenceFacet[]> {
  const { data, error } = await supabase
    .from("apartment_search_view" as never)
    .select("residence_id, residence_nom_fr, residence_nom_nl, ville")
    .eq("status", "available")
    .limit(2000);
  if (error) throw error;
  const map = new Map<string, ResidenceFacet>();
  for (const r of (data ?? []) as Array<{ residence_id: string; residence_nom_fr: string; residence_nom_nl: string | null; ville: string | null }>) {
    if (!map.has(r.residence_id)) {
      map.set(r.residence_id, { id: r.residence_id, nom_fr: r.residence_nom_fr, nom_nl: r.residence_nom_nl, ville: r.ville });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.nom_fr.localeCompare(b.nom_fr, "fr"));
}

export async function getCoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from("residence-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export type ApartmentDetail = {
  apartment: ApartmentSearchRow;
  residence: {
    id: string;
    slug: string;
    nom_fr: string;
    nom_nl: string | null;
    ville: string | null;
    region: string | null;
  };
  photos: { id: string; url: string; alt: string; cover: boolean }[];
};

export async function getApartmentById(id: string): Promise<ApartmentDetail | null> {
  const { data: apt } = await supabase
    .from("apartment_search_view" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!apt) return null;
  const a = apt as unknown as ApartmentSearchRow;

  const { data: r } = await supabase
    .from("residences")
    .select("id, slug, nom_fr, nom_nl, ville, region")
    .eq("id", a.residence_id)
    .maybeSingle();
  if (!r) return null;

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path, alt_text, category, display_order")
    .eq("residence_id", a.residence_id)
    .order("display_order");

  const photoUrls: ApartmentDetail["photos"] = [];
  for (const ph of photos ?? []) {
    const url = await getCoverUrl(ph.storage_path);
    if (url) {
      photoUrls.push({
        id: ph.id,
        url,
        alt: ph.alt_text ?? "",
        cover: ph.category === "cover",
      });
    }
  }

  return { apartment: a, residence: r, photos: photoUrls };
}

