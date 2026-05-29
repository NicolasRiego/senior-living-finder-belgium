import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";

type Catalog = { id: string; code: string; label_fr: string; category: string | null; is_custom?: boolean };

type PriceUnit =
  | "par séance"
  | "par repas"
  | "par mois"
  | "par semaine"
  | "par jour"
  | "par an"
  | "forfait";

const PRICE_UNITS: PriceUnit[] = [
  "par séance",
  "par repas",
  "par mois",
  "par semaine",
  "par jour",
  "par an",
  "forfait",
];

type SelectedItem = {
  included: boolean;
  optional: boolean;
  price: number | null;
  price_unit: PriceUnit | null;
  is_free: boolean;
  from_charges: boolean;
  charges_label: string | null;
  lunch_price: number | null;
  dinner_price: number | null;
};
type Selected = Record<string, SelectedItem>;
type Charge = { id: string; label: string; amount: number };

function isRestaurant(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes("restaurant") || l.includes("repas") || l.includes("restauration");
}

export default function ServicesStep({ residence, setExternalSaving }: StepProps) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        price_unit: (s.price_unit ?? null) as PriceUnit | null,
        is_free: s.is_free ?? false,
        from_charges: s.from_charges ?? false,
        charges_label: s.charges_label ?? null,
        lunch_price: s.lunch_price ?? null,
        dinner_price: s.dinner_price ?? null,
      };
    });
    setSelected(map);
    setCharges((ch.data ?? []) as Charge[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [residence.id]);

  const saveAll = async () => {
    setSaving(true);
    setExternalSaving("saving");
    let errorCount = 0;
    for (const [service_id, v] of Object.entries(selected)) {
      if (v.from_charges) continue;
      const { error } = await supabase.from("residence_services").upsert({
        residence_id: residence.id,
        service_id,
        included: v.included,
        optional: v.optional,
        price: v.is_free ? null : v.price,
        price_unit: v.is_free ? null : v.price_unit,
        is_free: v.is_free,
        from_charges: v.from_charges,
        charges_label: v.charges_label,
        lunch_price: v.is_free ? null : v.lunch_price,
        dinner_price: v.is_free ? null : v.dinner_price,
      } as any, { onConflict: "residence_id,service_id" as any });
      if (error) errorCount++;
    }
    setSaving(false);
    if (errorCount > 0) {
      setExternalSaving("error");
      toast.error("Erreur lors de l'enregistrement");
    } else {
      setExternalSaving("saved");
      toast.success("Modifications enregistrées");
    }
  };

  const toggle = async (sid: string, included: boolean) => {
    if (!included) {
      await supabase.from("residence_services").delete().eq("residence_id", residence.id).eq("service_id", sid);
      setSelected((s) => { const c = { ...s }; delete c[sid]; return c; });
      return;
    }
    setSelected((s) => ({
      ...s,
      [sid]: {
        included: true, optional: false, price: null, price_unit: null,
        is_free: false, from_charges: false, charges_label: null,
        lunch_price: null, dinner_price: null,
      },
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
      toast.error(error?.message ? `Erreur: ${error.message}` : "Erreur inconnue");
      setCreatingService(false);
      return;
    }
    setCatalog((prev) => [...prev, data as any]);
    await supabase.from("residence_services").upsert({
      residence_id: residence.id, service_id: (data as any).id,
      included: true, optional: false, price: null, price_unit: null,
      is_free: false, from_charges: false,
    } as any, { onConflict: "residence_id,service_id" as any });
    setSelected((prev) => ({
      ...prev,
      [(data as any).id]: {
        included: true, optional: false, price: null, price_unit: null,
        is_free: false, from_charges: false, charges_label: null,
        lunch_price: null, dinner_price: null,
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
    setSelected((prev) => { const next = { ...prev }; delete next[serviceId]; return next; });
    toast.success(`Service "${label}" supprimé.`);
  };

  if (loading) return <Card><CardContent className="py-8 text-muted-foreground">Chargement…</CardContent></Card>;

  const grouped: Record<string, Catalog[]> = {};
  catalog.forEach((c) => {
    const k = c.category ?? "Autres";
    (grouped[k] ||= []).push(c);
  });

  const updateSel = (sid: string, patch: Partial<SelectedItem>) =>
    setSelected((m) => ({ ...m, [sid]: { ...m[sid], ...patch } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 5 — Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {charges.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-primary">
              Services inclus automatiquement via les charges obligatoires (onglet Tarifs)
            </p>
            {charges.map((c) => (
              <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-primary/10 last:border-0">
                <span className="font-medium">{c.label}</span>
                <span className="text-primary font-semibold">{c.amount.toLocaleString("fr-BE")} € par mois</span>
              </div>
            ))}
          </div>
        )}

        {catalog.length === 0 && (
          <p className="text-muted-foreground">Aucun service au catalogue pour l'instant.</p>
        )}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h3 className="font-display text-lg">{cat}</h3>
            {items.map((s) => {
              const sel = selected[s.id];
              const isFromCharges = sel?.from_charges === true;
              const isIncluded = !!sel?.included;
              const restaurantService = isRestaurant(s.label_fr);
              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isFromCharges ? "border-primary/30 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isIncluded || isFromCharges}
                      onCheckedChange={(v) => !isFromCharges && toggle(s.id, !!v)}
                      id={`svc-${s.id}`}
                      disabled={isFromCharges}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`svc-${s.id}`} className={`flex-1 text-base ${isFromCharges ? "cursor-default" : "cursor-pointer"}`}>
                      {s.label_fr}
                      {s.is_custom && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Personnalisé</span>
                      )}
                      {isFromCharges && (
                        <span className="ml-2 text-xs text-primary font-normal">(inclus dans les charges)</span>
                      )}
                    </Label>

                    {isIncluded && !isFromCharges && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <Checkbox
                            checked={sel?.is_free === true}
                            onCheckedChange={(v) =>
                              updateSel(s.id, {
                                is_free: !!v,
                                optional: !!v ? false : sel.optional,
                                price: !!v ? null : sel.price,
                                price_unit: !!v ? null : sel.price_unit,
                                lunch_price: !!v ? null : sel.lunch_price,
                                dinner_price: !!v ? null : sel.dinner_price,
                              })
                            }
                          />
                          Inclus
                        </label>
                        {!sel?.is_free && (
                          <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                            <Checkbox
                              checked={sel?.optional === true}
                              onCheckedChange={(v) => updateSel(s.id, { optional: !!v })}
                            />
                            Optionnel
                          </label>
                        )}
                      </div>
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
                        aria-label="Supprimer ce service personnalisé"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isIncluded && !isFromCharges && sel?.optional && !sel?.is_free && (
                    <div className="mt-3 pl-8 space-y-3">
                      {restaurantService ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-sm">Prix moyen déjeuner (€)</Label>
                              <Input
                                type="number"
                                placeholder="ex. 12"
                                value={sel.lunch_price ?? ""}
                                onChange={(e) =>
                                  updateSel(s.id, {
                                    lunch_price: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm">Prix moyen dîner (€)</Label>
                              <Input
                                type="number"
                                placeholder="ex. 18"
                                value={sel.dinner_price ?? ""}
                                onChange={(e) =>
                                  updateSel(s.id, {
                                    dinner_price: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                              />
                            </div>
                          </div>
                          {(sel.lunch_price || sel.dinner_price) && (
                            <p className="text-sm text-muted-foreground italic">
                              Aperçu : {sel.lunch_price ? `Déjeuner ~${sel.lunch_price}€` : ""}
                              {sel.lunch_price && sel.dinner_price ? " / " : ""}
                              {sel.dinner_price ? `Dîner ~${sel.dinner_price}€` : ""} par repas
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-sm">Prix (€)</Label>
                              <Input
                                type="number"
                                placeholder="ex. 30"
                                value={sel.price ?? ""}
                                onChange={(e) =>
                                  updateSel(s.id, {
                                    price: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm">Unité de prix</Label>
                              <Select
                                value={sel.price_unit ?? ""}
                                onValueChange={(v) => updateSel(s.id, { price_unit: v as PriceUnit })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choisir une unité" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRICE_UNITS.map((u) => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {sel.price != null && sel.price_unit && (
                            <p className="text-sm text-muted-foreground italic">
                              Aperçu : Ce service coûte {sel.price}€ {sel.price_unit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="mt-6 rounded-xl border-2 border-dashed border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm">+ Créer un service personnalisé</h3>
          <p className="text-xs text-muted-foreground">
            Ajoutez un service propre à votre résidence. Vous pourrez ensuite cocher « Inclus » ou « Optionnel » et configurer son prix ci-dessus.
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
                onKeyDown={(e) => { if (e.key === "Enter") createCustomService(); }}
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

        <div className="sticky bottom-4 z-10 flex justify-end pt-2">
          <Button
            onClick={saveAll}
            disabled={saving}
            size="lg"
            className="shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
