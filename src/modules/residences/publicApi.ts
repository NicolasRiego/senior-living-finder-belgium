import { supabase } from "@/integrations/supabase/client";

export type SearchRow = {
  id: string;
  slug: string;
  nom_fr: string;
  nom_nl: string | null;
  tagline_fr: string | null;
  tagline_nl: string | null;
  type_etablissement: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  province: string | null;
  region: string | null;
  capacity: number | null;
  status: string;
  price_from: number | null;
  rent_from: number | null;
  completeness: number;
  is_complete: boolean;
  cover_path: string | null;
  has_availability: boolean;
  is_pmr: boolean;
  included_service_codes: string[];
};

export type SearchFilters = {
  q?: string;
  region?: string;
  province?: string;
  ville?: string;
  type_etablissement?: string;
  budget_max?: number;
  services?: string[]; // service codes that must be included
  pmr?: boolean;
  complete?: boolean;
  available?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export async function searchResidences(filters: SearchFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("residence_search_view" as any)
    .select("*", { count: "exact" })
    .eq("status", "published");

  if (filters.region) q = q.eq("region", filters.region);
  if (filters.province) q = q.eq("province", filters.province);
  if (filters.ville) q = q.ilike("ville", `%${filters.ville}%`);
  if (filters.type_etablissement) q = q.eq("type_etablissement", filters.type_etablissement);
  if (filters.budget_max != null) q = q.lte("price_from", filters.budget_max);
  if (filters.pmr) q = q.eq("is_pmr", true);
  if (filters.complete) q = q.eq("is_complete", true);
  if (filters.available) q = q.eq("has_availability", true);
  if (filters.services && filters.services.length > 0) {
    q = q.contains("included_service_codes", filters.services);
  }
  if (filters.q && filters.q.trim()) {
    const needle = filters.q.trim();
    q = q.or(`nom_fr.ilike.%${needle}%,ville.ilike.%${needle}%`);
  }

  if (filters.sort === "price_asc") q = q.order("price_from", { ascending: true, nullsFirst: false });
  else if (filters.sort === "price_desc") q = q.order("price_from", { ascending: false, nullsFirst: false });
  else q = q.order("is_complete", { ascending: false }).order("completeness", { ascending: false });

  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as SearchRow[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getCoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // demo / external URLs
  const { data } = await supabase.storage.from("residence-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getDistinctFacets() {
  const { data } = await supabase
    .from("residence_search_view" as any)
    .select("region, province, ville")
    .eq("status", "published");
  const rows = (data ?? []) as unknown as Pick<SearchRow, "region" | "province" | "ville">[];
  const regions = Array.from(new Set(rows.map((r) => r.region).filter(Boolean) as string[])).sort();
  const provinces = Array.from(new Set(rows.map((r) => r.province).filter(Boolean) as string[])).sort();
  const cities = Array.from(new Set(rows.map((r) => r.ville).filter(Boolean) as string[])).sort();
  return { regions, provinces, cities };
}

export async function getServicesCatalog() {
  const { data } = await supabase
    .from("services_catalog")
    .select("id, code, label_fr, category")
    .order("category", { ascending: true })
    .order("label_fr", { ascending: true });
  return data ?? [];
}

export async function getResidenceFullBySlug(slug: string) {
  const { data: r } = await supabase
    .from("residences")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!r) return null;
  const [units, services, activities, photos, apts, chargesRes] = await Promise.all([
    supabase.from("unit_types").select("*").eq("residence_id", r.id),
    supabase.from("residence_services").select("*, services_catalog(*)").eq("residence_id", r.id),
    supabase.from("residence_activities").select("*, activities_catalog(*)").eq("residence_id", r.id),
    supabase.from("photos").select("*").eq("residence_id", r.id).order("display_order"),
    supabase
      .from("apartments")
      .select(
        "type, surface_m2, transaction_type, rent_price, sale_price, status, available_from, wheelchair_accessible",
      )
      .eq("residence_id", r.id)
      .neq("status", "unavailable")
      .order("type"),
    supabase
      .from("residence_charges")
      .select("*")
      .eq("residence_id", r.id)
      .eq("is_mandatory", true)
      .order("sort_order"),
  ]);
  const unitIds = (units.data ?? []).map((u: any) => u.id);
  let pricing: any[] = [];
  if (unitIds.length) {
    const p = await supabase.from("pricing").select("*").in("unit_type_id", unitIds);
    pricing = p.data ?? [];
  }
  const unitSummaries = computeUnitSummaries((apts.data ?? []) as any[]);
  // Sign photo URLs (or pass through external/demo URLs)
  const photoUrls: { id: string; url: string; alt: string; category: string; cover: boolean }[] = [];
  for (const ph of photos.data ?? []) {
    let url: string | null = null;
    if (/^https?:\/\//i.test(ph.storage_path)) {
      url = ph.storage_path;
    } else {
      const { data: signed } = await supabase.storage.from("residence-photos").createSignedUrl(ph.storage_path, 3600);
      url = signed?.signedUrl ?? null;
    }
    if (url) {
      photoUrls.push({
        id: ph.id,
        url,
        alt: ph.alt_text ?? "",
        category: ph.category,
        cover: ph.category === "cover",
      });
    }
  }
  return {
    residence: r,
    units: units.data ?? [],
    unitSummaries,
    pricing,
    services: services.data ?? [],
    activities: activities.data ?? [],
    photos: photoUrls,
    charges: chargesRes.data ?? [],
  };
}

export type PublicUnitSummary = {
  type: string;
  total: number;
  available: number;
  availableNow: number;
  surfaceMin: number | null;
  surfaceMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  saleMin: number | null;
  hasRent: boolean;
  hasSale: boolean;
  pmr: number;
};

function computeUnitSummaries(apts: Array<{
  type: string;
  surface_m2: number | null;
  transaction_type: string | null;
  rent_price: number | null;
  sale_price: number | null;
  status: string;
  available_from: string | null;
  wheelchair_accessible: boolean;
}>): PublicUnitSummary[] {
  const map: Record<string, PublicUnitSummary> = {};
  const now = new Date();
  for (const a of apts) {
    if (!a.type) continue;
    if (!map[a.type]) {
      map[a.type] = {
        type: a.type, total: 0, available: 0, availableNow: 0,
        surfaceMin: null, surfaceMax: null,
        rentMin: null, rentMax: null, saleMin: null,
        hasRent: false, hasSale: false, pmr: 0,
      };
    }
    const s = map[a.type];
    s.total++;
    if (a.status === "available") {
      s.available++;
      if (!a.available_from || new Date(a.available_from) <= now) s.availableNow++;
    }
    if (a.surface_m2) {
      s.surfaceMin = s.surfaceMin === null ? a.surface_m2 : Math.min(s.surfaceMin, a.surface_m2);
      s.surfaceMax = s.surfaceMax === null ? a.surface_m2 : Math.max(s.surfaceMax, a.surface_m2);
    }
    if (a.rent_price && a.transaction_type && ["rent", "both"].includes(a.transaction_type)) {
      s.hasRent = true;
      s.rentMin = s.rentMin === null ? a.rent_price : Math.min(s.rentMin, a.rent_price);
      s.rentMax = s.rentMax === null ? a.rent_price : Math.max(s.rentMax, a.rent_price);
    }
    if (a.sale_price && a.transaction_type && ["sale", "both"].includes(a.transaction_type)) {
      s.hasSale = true;
      s.saleMin = s.saleMin === null ? a.sale_price : Math.min(s.saleMin, a.sale_price);
    }
    if (a.wheelchair_accessible) s.pmr++;
  }
  return Object.values(map).sort((a, b) => a.type.localeCompare(b.type));
}
