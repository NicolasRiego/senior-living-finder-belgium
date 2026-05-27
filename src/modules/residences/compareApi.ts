import { supabase } from "@/integrations/supabase/client";
import { getCoverUrl } from "./publicApi";

export type CompareItem = {
  id: string;
  slug: string;
  nom_fr: string;
  type_etablissement: string;
  ville: string | null;
  region: string | null;
  province: string | null;
  adresse: string | null;
  code_postal: string | null;
  capacity: number | null;
  surface_min: number | null;
  surface_max: number | null;
  apartment_types: string[];
  contact_email: string | null;
  contact_phone: string | null;
  proximity: Record<string, unknown>;
  cover_url: string | null;
  price_from: number | null;
  rent_from: number | null;
  pricing: { unit_type_id: string; estimated_monthly_min: number | null; estimated_monthly_max: number | null; rent_min: number | null; rent_max: number | null }[];
  service_codes: Set<string>;
  activity_codes: Set<string>;
  is_pmr: boolean;
  has_availability: boolean;
};

type SearchViewRow = {
  id: string;
  slug: string;
  nom_fr: string;
  type_etablissement: string;
  ville: string | null;
  region: string | null;
  province: string | null;
  capacity: number | null;
  surface_min: number | null;
  surface_max: number | null;
  apartment_types: string[] | null;
  price_from: number | null;
  rent_from: number | null;
  cover_path: string | null;
  is_pmr: boolean | null;
  has_availability: boolean | null;
};

export async function fetchCompareItems(ids: string[]): Promise<CompareItem[]> {
  if (ids.length === 0) return [];

  const { data: rows } = await supabase
    .from("residence_search_view" as never)
    .select("*")
    .in("id", ids);

  const viewRows = (rows ?? []) as unknown as SearchViewRow[];

  const results: CompareItem[] = [];
  for (const v of viewRows) {
    const [pricing, services, activities, residence] = await Promise.all([
      (async () => {
        const u = await supabase.from("unit_types").select("id").eq("residence_id", v.id);
        const utIds = (u.data ?? []).map((x) => x.id);
        if (!utIds.length) return { data: [] as CompareItem["pricing"] };
        return supabase
          .from("pricing")
          .select("unit_type_id, estimated_monthly_min, estimated_monthly_max, rent_min, rent_max")
          .in("unit_type_id", utIds);
      })(),
      supabase
        .from("residence_services")
        .select("included, services_catalog(code)")
        .eq("residence_id", v.id)
        .eq("included", true),
      supabase
        .from("residence_activities")
        .select("activities_catalog(code)")
        .eq("residence_id", v.id),
      supabase
        .from("residences")
        .select("adresse, code_postal, contact_email, contact_phone, proximity")
        .eq("id", v.id)
        .maybeSingle(),
    ]);

    const resolved = await getCoverUrl(v.cover_path);
    const cover_url = resolved ?? "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200";
    const serviceCodes = new Set<string>(
      (services.data ?? [])
        .map((s: { services_catalog?: { code?: string } | null }) => s.services_catalog?.code)
        .filter((x): x is string => !!x),
    );
    const activityCodes = new Set<string>(
      (activities.data ?? [])
        .map((a: { activities_catalog?: { code?: string } | null }) => a.activities_catalog?.code)
        .filter((x): x is string => !!x),
    );

    results.push({
      id: v.id,
      slug: v.slug,
      nom_fr: v.nom_fr,
      type_etablissement: v.type_etablissement,
      ville: v.ville,
      region: v.region,
      province: v.province,
      adresse: residence.data?.adresse ?? null,
      code_postal: residence.data?.code_postal ?? null,
      capacity: v.capacity,
      surface_min: v.surface_min,
      surface_max: v.surface_max,
      apartment_types: v.apartment_types ?? [],
      contact_email: residence.data?.contact_email ?? null,
      contact_phone: residence.data?.contact_phone ?? null,
      proximity: (residence.data?.proximity as Record<string, unknown>) ?? {},
      cover_url,
      price_from: v.price_from,
      rent_from: v.rent_from,
      pricing: (pricing.data ?? []) as CompareItem["pricing"],
      service_codes: serviceCodes,
      activity_codes: activityCodes,
      is_pmr: !!v.is_pmr,
      has_availability: !!v.has_availability,
    });
  }

  results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return results;
}

export async function fetchServicesLabels(codes: string[]) {
  if (!codes.length) return new Map<string, string>();
  const { data } = await supabase
    .from("services_catalog")
    .select("code, label_fr")
    .in("code", codes);
  return new Map((data ?? []).map((s) => [s.code, s.label_fr]));
}

export async function fetchActivitiesLabels(codes: string[]) {
  if (!codes.length) return new Map<string, string>();
  const { data } = await supabase
    .from("activities_catalog")
    .select("code, label_fr")
    .in("code", codes);
  return new Map((data ?? []).map((s) => [s.code, s.label_fr]));
}
