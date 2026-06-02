import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";

export type SelectedServicesPayload = Record<string, {
  enabled: boolean;
  freq?: number;
  freqKind?: "week" | "month";
  lunchPerWeek?: number;
  dinnerPerWeek?: number;
}>;

export type BudgetSimulationRow = {
  id: string;
  name: string;
  apartment_id: string;
  selected_services: SelectedServicesPayload;
  total_monthly: number;
  total_annual: number;
  created_at: string;
  updated_at: string;
};

const listeners = new Set<() => void>();
export function notifySimulationsChanged() {
  listeners.forEach((l) => l());
}

export function useBudgetSimulations() {
  const { user } = useAuth();
  const [items, setItems] = useState<BudgetSimulationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("budget_simulations")
      .select("id, name, apartment_id, selected_services, total_monthly, total_annual, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) {
      setItems((data ?? []) as unknown as BudgetSimulationRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const fn = () => load();
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [load]);

  return { items, loading, refresh: load };
}
