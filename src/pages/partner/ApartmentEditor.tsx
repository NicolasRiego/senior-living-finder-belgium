import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";
import {
  ApartmentFormState, emptyForm, formToPayload, rowToForm,
} from "@/modules/apartments/editor/types";
import ApartmentEditorShell from "@/modules/apartments/editor/ApartmentEditorShell";
import NewApartmentForm from "@/modules/apartments/editor/NewApartmentForm";

export default function ApartmentEditor() {
  const { residenceId, apartmentId } = useParams<{ residenceId: string; apartmentId?: string }>();
  const navigate = useNavigate();
  const { isAdmin, orgIds } = useAuth();
  const isEdit = !!apartmentId;
  const [form, setForm] = useState<ApartmentFormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<ApartmentFormState>(emptyForm);
  const [residenceName, setResidenceName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!residenceId) return;
    (async () => {
      const { data: r } = await supabase
        .from("residences")
        .select("id, nom_fr, org_id")
        .eq("id", residenceId)
        .maybeSingle();
      if (!r) { toast.error("Résidence introuvable"); navigate("/partenaire"); return; }
      if (!isAdmin && !orgIds.includes(r.org_id)) {
        toast.error("Accès non autorisé"); navigate("/partenaire"); return;
      }
      setResidenceName(r.nom_fr);

      if (isEdit && apartmentId) {
        const { data: a, error } = await supabase
          .from("apartments").select("*").eq("id", apartmentId).maybeSingle();
        if (error || !a) {
          toast.error("Appartement introuvable");
          navigate(`/partenaire/residences/${residenceId}/appartements`);
          return;
        }
        const { data: charges } = await supabase
          .from("apartment_additional_charges")
          .select("id, label, amount, description, is_included")
          .eq("apartment_id", apartmentId)
          .order("sort_order")
          .order("created_at");
        const next = rowToForm({
          ...(a as Record<string, unknown>),
          additional_charges: (charges ?? []).map((c) => ({
            id: c.id,
            label: c.label ?? "",
            amount: c.amount != null ? String(c.amount) : "",
            description: c.description ?? "",
            is_included: !!c.is_included,
            _persisted: true,
          })),
        });
        setForm(next);
        setSavedForm(next);
      }
      setLoading(false);
    })();
  }, [residenceId, apartmentId, isEdit, isAdmin, orgIds, navigate]);

  const persist = async () => {
    if (!residenceId || !apartmentId) return;
    const payload = formToPayload(form, residenceId);
    const { error } = await supabase
      .from("apartments")
      .update(payload)
      .eq("id", apartmentId);
    if (error) throw new Error(error.message);

    // Sync additional charges: delete removed, upsert current
    const { data: existing } = await supabase
      .from("apartment_additional_charges")
      .select("id")
      .eq("apartment_id", apartmentId);
    const keptIds = new Set(
      form.additional_charges.filter((c) => c._persisted).map((c) => c.id),
    );
    const toDelete = (existing ?? [])
      .map((r) => r.id)
      .filter((id) => !keptIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("apartment_additional_charges").delete().in("id", toDelete);
    }
    for (let i = 0; i < form.additional_charges.length; i++) {
      const c = form.additional_charges[i];
      const row = {
        apartment_id: apartmentId,
        label: c.label.trim(),
        amount: Number(c.amount) || 0,
        description: c.description.trim() || null,
        is_included: c.is_included,
        sort_order: i,
      };
      if (c._persisted) {
        await supabase
          .from("apartment_additional_charges")
          .update(row)
          .eq("id", c.id);
      } else {
        await supabase.from("apartment_additional_charges").insert(row);
      }
    }
    // Reload to sync persisted ids
    const { data: refreshed } = await supabase
      .from("apartment_additional_charges")
      .select("id, label, amount, description, is_included")
      .eq("apartment_id", apartmentId)
      .order("sort_order")
      .order("created_at");
    const refreshedCharges = (refreshed ?? []).map((c) => ({
      id: c.id,
      label: c.label ?? "",
      amount: c.amount != null ? String(c.amount) : "",
      description: c.description ?? "",
      is_included: !!c.is_included,
      _persisted: true,
    }));
    const newForm = { ...form, additional_charges: refreshedCharges };
    setForm(newForm);
    setSavedForm(newForm);
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;

  if (!isEdit) {
    return (
      <NewApartmentForm
        residenceId={residenceId!}
        residenceName={residenceName}
        form={form}
        setForm={setForm}
      />
    );
  }

  return (
    <ApartmentEditorShell
      form={form}
      savedForm={savedForm}
      setForm={setForm}
      persist={persist}
      residenceName={residenceName}
      apartmentTitle={savedForm.title_fr || "Modifier l'appartement"}
    />
  );
}
