import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { useAutosave } from "../useAutosave";

type Catalog = { id: string; code: string; label_fr: string; category: string | null; is_custom?: boolean };
type SelectedItem = {
  included: boolean;
  optional: boolean;
  price: number | null;
  is_free: boolean;
  from_charges: boolean;
  charges_label: string | null;
};
type Selected = Record<string, SelectedItem>;
type Charge = { id: string; label: string; amount: number };

export default function ServicesStep({ residence, setExternalSaving }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newServiceLabel, setNewServiceLabel] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Autres");
  const [creatingService, setCreatingService] = useState(false);

  const load = async () => {
    setLoading(true);
    const [cat, sel, ch] = await Promise.all([
      supabase
        .from("services_catalog")
        .select("id,code,label_fr,category,is_custom")
        .or(`is_custom.eq.false,created_by_residence.eq.${residence.id}`)
        .order("category"),
      supabase.from("residence_services").select("*").eq("residence_id", residence.id),
      supabase
        .from("residence_charges")
        .select("*")
        .eq("residence_id", residence.id)
        .eq("is_mandatory", true)
        .gt("amount", 0)
        .neq("label", "Nouveau service"),
    ]);
    setCatalog((cat.data ?? []) as any);
    const map: Selected = {};
    (sel.data ?? []).forEach((s: any) => {
      map[s.service_id] = {
        included: s.included,
        optional: s.optional,
        price: s.price,
        is_free: s.is_free ?? false,
        from_charges: s.from_charges ?? false,
        charges_label: s.charges_label ?? null,
      };
    });
    setSelected(map);
    setCharges((ch.data ?? []) as Charge[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [residence.id]);

  useAutosave(selected, async (sel) => {
    setExternalSaving("saving");
    for (const [service_id, v] of Object.entries(sel)) {
      if (v.from_charges) continue;
      const { error } = await supabase.from("residence_services").upsert({
        residence_id: residence.id,
        service_id,
        included: v.included,
        optional: v.optional,
        price: v.is_free ? null : v.price,
        is_free: v.is_free,
        from_charges: v.from_charges,
        charges_label: v.charges_label,
      } as any, { onConflict: "residence_id,service_id" as any });
      if (error) { setExternalSaving("error"); return; }
    }
    setExternalSaving("saved");
  }, { enabled: !loading });

  const toggle = async (sid: string, included: boolean) => {
    if (!included) {
      await supabase.from("residence_services").delete().eq("residence_id", residence.id).eq("service_id", sid);
      setSelected((s) => { const c = { ...s }; delete c[sid]; return c; });
      return;
    }
    setSelected((s) => ({
      ...s,
      [sid]: { included: true, optional: false, price: null, is_free: false, from_charges: false, charges_label: null },
    }));
  };

  const createCustomService = async () => {
    if (!newServiceLabel.trim()) return;
    setCreatingService(true);
    const code = `custom_${residence.id.slice(0, 8)}_${Date.now()}`;
    const { data, error } = await supabase
      .from("services_catalog")
      .insert({
        code,
        label_fr: newServiceLabel.trim(),
        category: newServiceCategory,
        is_custom: true,
        created_by_residence: residence.id,
      } as any)
      .select()
      .single();
    if (error || !data) {
      console.error("Erreur création service:", error);
      toast.error(error?.message ? `Erreur: ${error.message}` : "Erreur inconnue lors de la création");
      setCreatingService(false);
      return;
    }
    setCatalog((prev) => [...prev, data as any]);
    await supabase.from("residence_services").upsert(
      {
        residence_id: residence.id,
        service_id: (data as any).id,
        included: true,
        optional: false,
        price: null,
        is_free: false,
        from_charges: false,
      } as any,
      { onConflict: "residence_id,service_id" as any },
    );
    setSelected((prev) => ({
      ...prev,
      [(data as any).id]: {
        included: true,
        optional: false,
        price: null,
        is_free: false,
        from_charges: false,
        charges_label: null,
      },
    }));
    setNewServiceLabel("");
    setCreatingService(false);
    toast.success(`Service "${(data as any).label_fr}" créé.`);
  };

  const deleteCustomService = async (serviceId: string, label: string) => {
    await supabase.from("residence_services").delete().eq("residence_id", residence.id).eq("service_id", serviceId);
    await supabase.from("services_catalog").delete().eq("id", serviceId);
    setCatalog((prev) => prev.filter((c) => c.id !== serviceId));
    setSelected((prev) => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
    toast.success(`Service "${label}" supprimé.`);
  };

  if (loading) return <Card><CardContent className="py-8 text-muted-foreground">Chargement…</CardContent></Card>;

  const grouped: Record<string, Catalog[]> = {};
  catalog.forEach((c) => {
    const k = c.category ?? "Autres";
    (grouped[k] ||= []).push(c);
  });

  return (
    <Card>
      <CardHeader><CardTitle>Étape 5 — Services</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {charges.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-primary">
              Services inclus automatiquement via les charges obligatoires (onglet Tarifs)
            </p>
            {charges.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center text-sm py-1 border-b border-primary/10 last:border-0"
              >
                <span className="font-medium">{c.label}</span>
                <span className="text-primary font-semibold">
                  {c.amount.toLocaleString("fr-BE")} €/mois
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Ces services apparaissent automatiquement sur la fiche publique. Modifiez-les dans l'onglet Tarifs.
            </p>
          </div>
        )}

        {catalog.length === 0 && (
          <p className="text-muted-foreground">
            Aucun service au catalogue pour l'instant. L'administrateur doit l'enrichir.
          </p>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h3 className="font-display text-lg">{cat}</h3>
            {items.map((s) => {
              const sel = selected[s.id];
              const isFromCharges = sel?.from_charges === true;
              const isIncluded = !!sel?.included;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isFromCharges ? "border-primary/30 bg-primary/5" : "border-border"
                  }`}
                >
                  <Checkbox
                    checked={isIncluded || isFromCharges}
                    onCheckedChange={(v) => !isFromCharges && toggle(s.id, !!v)}
                    id={`svc-${s.id}`}
                    disabled={isFromCharges}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor={`svc-${s.id}`}
                    className={`flex-1 text-base ${isFromCharges ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {s.label_fr}
                    {s.is_custom && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Personnalisé
                      </span>
                    )}
                    {isFromCharges && (
                      <span className="ml-2 text-xs text-primary font-normal">
                        (inclus dans les charges)
                      </span>
                    )}
                  </Label>

                  {isIncluded && !isFromCharges && (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                        <Checkbox
                          checked={sel?.is_free === true}
                          onCheckedChange={(v) =>
                            setSelected((m) => ({
                              ...m,
                              [s.id]: {
                                ...m[s.id],
                                is_free: !!v,
                                optional: !!v ? false : m[s.id].optional,
                                price: !!v ? null : m[s.id].price,
                              },
                            }))
                          }
                        />
                        Gratuit
                      </label>

                      {!sel?.is_free && (
                        <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <Checkbox
                            checked={sel?.optional === true}
                            onCheckedChange={(v) =>
                              setSelected((m) => ({
                                ...m,
                                [s.id]: { ...m[s.id], optional: !!v },
                              }))
                            }
                          />
                          Optionnel
                        </label>
                      )}

                      {sel?.optional && !sel?.is_free && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="€"
                            value={sel.price ?? ""}
                            onChange={(e) =>
                              setSelected((m) => ({
                                ...m,
                                [s.id]: {
                                  ...m[s.id],
                                  price: e.target.value ? Number(e.target.value) : null,
                                },
                              }))
                            }
                            className="w-24 h-10"
                          />
                          <span className="text-xs text-muted-foreground">/mois</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isFromCharges && sel?.price && (
                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                      {sel.price} €/mois
                    </span>
                  )}

                  {s.is_custom && !isFromCharges && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Supprimer le service "${s.label_fr}" ?`)) {
                          deleteCustomService(s.id, s.label_fr);
                        }
                      }}
                      title="Supprimer ce service personnalisé"
                      aria-label="Supprimer ce service personnalisé"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="mt-6 rounded-xl border-2 border-dashed border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">+ Créer un service personnalisé</h3>
          <p className="text-xs text-muted-foreground">
            Ajoutez un service propre à votre résidence qui n'est pas dans le catalogue standard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="new-svc-label">Nom du service *</Label>
              <Input
                id="new-svc-label"
                value={newServiceLabel}
                onChange={(e) => setNewServiceLabel(e.target.value)}
                placeholder="ex: Atelier jardinage, Service pressing..."
                className="h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCustomService();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-svc-cat">Catégorie</Label>
              <select
                id="new-svc-cat"
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
              >
                <option value="accueil">Accueil</option>
                <option value="bien-etre">Bien-être</option>
                <option value="confort">Confort</option>
                <option value="mobilite">Mobilité</option>
                <option value="sante">Santé</option>
                <option value="restauration">Restauration</option>
                <option value="loisirs">Loisirs</option>
                <option value="Autres">Autres</option>
              </select>
            </div>
          </div>
          <Button
            onClick={createCustomService}
            disabled={!newServiceLabel.trim() || creatingService}
            variant="outline"
            className="w-full"
          >
            {creatingService ? "Création…" : "+ Ajouter ce service"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
