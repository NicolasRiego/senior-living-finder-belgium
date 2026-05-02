import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("favorites").select("residence_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r) => r.residence_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (residenceId: string) => {
    if (!user) {
      toast.info("Connectez-vous pour sauvegarder vos favoris");
      return;
    }
    const isFav = ids.has(residenceId);
    if (isFav) {
      const { error } = await supabase.from("favorites").delete()
        .eq("user_id", user.id).eq("residence_id", residenceId);
      if (error) return toast.error(error.message);
      setIds((s) => { const n = new Set(s); n.delete(residenceId); return n; });
    } else {
      const { error } = await supabase.from("favorites")
        .insert({ user_id: user.id, residence_id: residenceId });
      if (error) return toast.error(error.message);
      setIds((s) => new Set(s).add(residenceId));
      toast.success("Ajouté à vos favoris");
    }
  };

  return { ids, has: (id: string) => ids.has(id), toggle, loading, refresh: load };
}
