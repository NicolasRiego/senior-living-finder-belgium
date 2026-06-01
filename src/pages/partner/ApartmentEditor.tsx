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
        const next = rowToForm(a as Record<string, unknown>);
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
    setSavedForm(form);
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
