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

  q = q.order("created_at" as never, { ascending: false }).range(from, to);

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

export async function getCoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from("residence-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
