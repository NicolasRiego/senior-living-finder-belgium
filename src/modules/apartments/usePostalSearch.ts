import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PostalResult = {
  code_postal: string;
  commune_fr: string;
  ville_fr: string;
  province: string;
  region: string;
};

export function usePostalSearch(query: string) {
  const [results, setResults] = useState<PostalResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const isNumeric = /^\d+$/.test(query);
      const filter = isNumeric
        ? `code_postal.ilike.${query}%`
        : `commune_fr.ilike.${query}%,ville_fr.ilike.${query}%`;
      const { data } = await supabase
        .from("be_postal_codes")
        .select("code_postal,commune_fr,ville_fr,province,region")
        .or(filter)
        .order("code_postal")
        .limit(8);
      setResults((data ?? []) as PostalResult[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
