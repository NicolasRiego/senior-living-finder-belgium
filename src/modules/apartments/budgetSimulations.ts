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

export async function upsertSimulation(input: {
  user_id: string;
  apartment_id: string;
  name: string;
  selected_services: SelectedServicesPayload;
  total_monthly: number;
  total_annual: number;
}): Promise<{ data: BudgetSimulationRow | null; error: Error | null; created: boolean }> {
  // Check existing
  const { data: existing } = await supabase
    .from("budget_simulations")
    .select("id, name")
    .eq("user_id", input.user_id)
    .eq("apartment_id", input.apartment_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("budget_simulations")
      .update({
        name: input.name,
        selected_services: input.selected_services as never,
        total_monthly: input.total_monthly,
        total_annual: input.total_annual,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, name, apartment_id, selected_services, total_monthly, total_annual, created_at, updated_at")
      .maybeSingle();
    return { data: data as unknown as BudgetSimulationRow, error: error as Error | null, created: false };
  }

  const { data, error } = await supabase
    .from("budget_simulations")
    .insert({
      user_id: input.user_id,
      apartment_id: input.apartment_id,
      name: input.name,
      selected_services: input.selected_services as never,
      total_monthly: input.total_monthly,
      total_annual: input.total_annual,
    })
    .select("id, name, apartment_id, selected_services, total_monthly, total_annual, created_at, updated_at")
    .maybeSingle();
  return { data: data as unknown as BudgetSimulationRow, error: error as Error | null, created: true };
}

export async function deleteSimulationForApartment(userId: string, apartmentId: string) {
  return supabase
    .from("budget_simulations")
    .delete()
    .eq("user_id", userId)
    .eq("apartment_id", apartmentId);
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
      .order("updated_at", { ascending: false });
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
