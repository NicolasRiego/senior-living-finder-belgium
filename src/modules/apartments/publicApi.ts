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

  if (filters.code_postal) {
    const codes = filters.code_postal
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length === 1) q = q.ilike("code_postal", `${codes[0]}%`);
    else if (codes.length > 1) q = q.in("code_postal", codes);
  }
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.surface_min) q = q.gte("surface_m2", filters.surface_min);

  if (filters.tx !== "rent") {
    if (filters.sale_max) q = q.lte("sale_price", filters.sale_max);
    if (filters.sale_min) q = q.gte("sale_price", filters.sale_min);
  }
  if (filters.tx !== "sale") {
    if (filters.rent_max) q = q.lte("rent_price", filters.rent_max);
    if (filters.rent_min) q = q.gte("rent_price", filters.rent_min);
  }

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

export type ResidenceFacet = {
  id: string;
  nom_fr: string;
  nom_nl: string | null;
  ville: string | null;
  code_postal: string | null;
  region: string | null;
  type_etablissement: string | null;
  capacity: number | null;
  price_from: number | null;
  cover_path: string | null;
  included_service_codes: string[];
};

export async function listApartmentResidences(): Promise<ResidenceFacet[]> {
  // 1. Distinct residence ids that have an available apartment
  const { data: apt, error: aptErr } = await supabase
    .from("apartment_search_view" as never)
    .select("residence_id")
    .eq("status", "available")
    .limit(5000);
  if (aptErr) throw aptErr;
  const ids = Array.from(
    new Set(((apt ?? []) as Array<{ residence_id: string }>).map((r) => r.residence_id)),
  );
  if (ids.length === 0) return [];

  // 2. Rich data from residence_search_view
  const { data, error } = await supabase
    .from("residence_search_view" as never)
    .select(
      "id, nom_fr, nom_nl, ville, code_postal, region, type_etablissement, capacity, price_from, cover_path, included_service_codes",
    )
    .in("id", ids);
  if (error) throw error;
  return ((data ?? []) as unknown as ResidenceFacet[]).sort((a, b) =>
    a.nom_fr.localeCompare(b.nom_fr, "fr"),
  );
}

export async function getCoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data, error } = await supabase.storage.from("residence-photos").createSignedUrl(path, 3600);
  if (error) {
    console.warn("getCoverUrl error:", path, error);
  }
  return data?.signedUrl ?? null;
}

export type ApartmentExtraFields = {
  title_fr: string | null;
  title_nl: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  living_room_m2: number | null;
  kitchen_type: string | null;
  build_year: number | null;
  building_floors: number | null;
  building_state: string | null;
  flooring: string | null;
  has_storage: boolean | null;
  storage_m2: number | null;
  has_laundry: boolean | null;
  has_dressing: boolean | null;
  has_office: boolean | null;
  terrace_m2: number | null;
  garden_m2: number | null;
  has_balcony: boolean | null;
  balcony_m2: number | null;
  orientation: string | null;
  parking_type: string | null;
  parking_count: number | null;
  has_lift: boolean | null;
  has_interphone: boolean | null;
  has_videophone: boolean | null;
  has_alarm: boolean | null;
  has_digicode: boolean | null;
  heating_type: string | null;
  hot_water: string | null;
  internet: string | null;
  energy_class: string | null;
  primary_energy: number | null;
  double_glazing: boolean | null;
  co2_emission: string | null;
  agency_fee: number | null;
  property_tax: number | null;
  co_ownership_fee: number | null;
  co_ownership_included: boolean | null;
  co_ownership_description: string | null;
  charges_monthly: number | null;
  charges_description: string | null;
  peb_certificate_url: string | null;
  peb_certificate_name: string | null;
  peb_certificate_visible: boolean | null;
};

export type AdditionalChargeRow = {
  id: string;
  label: string;
  amount: number;
  description: string | null;
  is_included: boolean;
};

export type ApartmentDetail = {
  apartment: ApartmentSearchRow & ApartmentExtraFields;
  residence: {
    id: string;
    slug: string;
    nom_fr: string;
    nom_nl: string | null;
    ville: string | null;
    region: string | null;
  };
  photos: { id: string; url: string; alt: string; cover: boolean }[];
  additional_charges: AdditionalChargeRow[];
};

export async function getApartmentById(id: string): Promise<ApartmentDetail | null> {
  const { data: apt } = await supabase
    .from("apartment_search_view" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!apt) return null;
  const a = apt as unknown as ApartmentSearchRow;

  const { data: extraRow } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

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

  const { data: additionalCharges } = await supabase
    .from("apartment_additional_charges")
    .select("id, label, amount, description, is_included, sort_order")
    .eq("apartment_id", id)
    .order("sort_order");

  const extra = (extraRow ?? {}) as Partial<ApartmentExtraFields>;
  const merged = { ...a, ...extra } as ApartmentSearchRow & ApartmentExtraFields;
  return {
    apartment: merged,
    residence: r,
    photos: photoUrls,
    additional_charges: (additionalCharges ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      amount: c.amount,
      description: c.description,
      is_included: c.is_included,
    })),
  };
}


