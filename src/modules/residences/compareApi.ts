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
  contact_email: string | null;
  contact_phone: string | null;
  proximity: Record<string, any>;
  cover_url: string | null;
  price_from: number | null;
  rent_from: number | null;
  units: { id: string; type: string; surface_min: number | null; surface_max: number | null; available_now: boolean }[];
  pricing: { unit_type_id: string; estimated_monthly_min: number | null; estimated_monthly_max: number | null; rent_min: number | null; rent_max: number | null }[];
  service_codes: Set<string>;
  activity_codes: Set<string>;
  is_pmr: boolean;
  has_availability: boolean;
};

export async function fetchCompareItems(ids: string[]): Promise<CompareItem[]> {
  if (ids.length === 0) return [];

  const { data: rows } = await supabase
    .from("residence_search_view" as any)
    .select("*")
    .in("id", ids);

  const viewRows = (rows ?? []) as any[];

  const results: CompareItem[] = [];
  for (const v of viewRows) {
    const [units, pricing, services, activities, residence] = await Promise.all([
      supabase.from("unit_types").select("id, type, surface_min, surface_max, available_now").eq("residence_id", v.id),
      (async () => {
        const u = await supabase.from("unit_types").select("id").eq("residence_id", v.id);
        const utIds = (u.data ?? []).map((x) => x.id);
        if (!utIds.length) return { data: [] as any[] };
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
    const cover_url = resolved ?? "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80";
    const serviceCodes = new Set<string>(
      (services.data ?? [])
        .map((s: any) => s.services_catalog?.code)
        .filter((x: any): x is string => !!x),
    );
    const activityCodes = new Set<string>(
      (activities.data ?? [])
        .map((a: any) => a.activities_catalog?.code)
        .filter((x: any): x is string => !!x),
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
      contact_email: residence.data?.contact_email ?? null,
      contact_phone: residence.data?.contact_phone ?? null,
      proximity: (residence.data?.proximity as Record<string, any>) ?? {},
      cover_url,
      price_from: v.price_from,
      rent_from: v.rent_from,
      units: (units.data ?? []) as any,
      pricing: (pricing.data ?? []) as any,
      service_codes: serviceCodes,
      activity_codes: activityCodes,
      is_pmr: !!v.is_pmr,
      has_availability: !!v.has_availability,
    });
  }

  // Preserve order of input ids
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
