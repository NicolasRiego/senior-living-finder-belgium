import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useRegisterWizardStep } from "@/modules/partner/WizardSaveContext";
import { StepProps } from "@/pages/partner/ResidenceEditor";

type BePostalCode = {
  code_postal: string;
  commune_fr: string;
  commune_nl: string;
  ville_fr: string;
  province: string;
  region: string;
};

function usePostalSearch(query: string) {
  const [results, setResults] = useState<BePostalCode[]>([]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const isNumeric = /^\d+$/.test(query);
      const { data } = await supabase
        .from("be_postal_codes" as any)
        .select("*")
        .or(
          isNumeric
            ? `code_postal.ilike.${query}%`
            : `commune_fr.ilike.%${query}%,ville_fr.ilike.%${query}%`,
        )
        .order("code_postal")
        .limit(10);
      setResults(((data ?? []) as unknown) as BePostalCode[]);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return results;
}

export default function AddressStep({ residence, onChange }: StepProps) {
  const initial = useRef({
    adresse: residence.adresse ?? "",
    code_postal: residence.code_postal ?? "",
    commune: (residence as any).commune ?? "",
    ville: residence.ville ?? "",
    province: residence.province ?? "",
    region: residence.region ?? "",
  });
  const [local, setLocal] = useState({
    adresse: residence.adresse ?? "",
    code_postal: residence.code_postal ?? "",
    commune: (residence as any).commune ?? "",
    ville: residence.ville ?? "",
    province: residence.province ?? "",
    region: residence.region ?? "",
  });

  const [cpQuery, setCpQuery] = useState(residence.code_postal ?? "");
  const [cpOpen, setCpOpen] = useState(false);
  const cpResults = usePostalSearch(cpQuery);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setCpOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isDirty = JSON.stringify(local) !== JSON.stringify(initial.current);

  const save = useCallback(async () => {
    const v = local;
    const { error } = await supabase
      .from("residences")
      .update({
        adresse: v.adresse || null,
        code_postal: v.code_postal || null,
        commune: v.commune || null,
        ville: v.ville || null,
        province: v.province || null,
        region: v.region || null,
      } as any)
      .eq("id", residence.id);
    if (error) throw error;
    initial.current = { ...v };
    onChange(v as any);
  }, [local, residence.id, onChange]);

  const reset = useCallback(() => {
    setLocal({ ...initial.current });
    setCpQuery(initial.current.code_postal);
  }, []);

  useRegisterWizardStep("address", { isDirty, save, reset });

  const update = (patch: Partial<typeof local>) =>
    setLocal((s) => ({ ...s, ...patch }));

  const autofill = (r: BePostalCode) => {
    update({
      code_postal: r.code_postal,
      commune: r.commune_fr,
      ville: r.ville_fr,
      province: r.province,
      region: r.region,
    });
    setCpQuery(r.code_postal);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 2 — Adresse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse complète *</Label>
          <Input
            id="adresse"
            value={local.adresse}
            onChange={(e) => update({ adresse: e.target.value })}
            placeholder="ex: Rue de la Paix 12, bte 3"
            className="h-12"
          />
        </div>

        <div className="space-y-2" ref={wrapRef}>
          <Label htmlFor="cp">Code postal *</Label>
          <div className="relative">
            <Input
              id="cp"
              value={cpQuery}
              onChange={(e) => {
                setCpQuery(e.target.value);
                setCpOpen(true);
                update({ code_postal: e.target.value });
              }}
              onFocus={() => setCpOpen(true)}
              placeholder="ex: 1000, 4000, Bruxelles..."
              autoComplete="off"
              className="h-12"
            />
            {cpOpen && cpResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
                {cpResults.map((r) => (
                  <button
                    key={r.code_postal + r.commune_fr}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex justify-between items-center"
                    onClick={() => {
                      autofill(r);
                      setCpOpen(false);
                    }}
                  >
                    <span>
                      <span className="font-semibold">{r.code_postal}</span>
                      {" · "}
                      {r.commune_fr}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {r.province}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="commune">Commune *</Label>
            <Input
              id="commune"
              value={local.commune}
              onChange={(e) => update({ commune: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ville">Ville *</Label>
            <Input
              id="ville"
              value={local.ville}
              onChange={(e) => update({ ville: e.target.value })}
              className="h-12"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Pour Bruxelles-Capitale, la ville est toujours
              "Bruxelles". La commune précise est indiquée
              dans le champ "Commune".
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={local.province}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              className="h-12 bg-muted/50 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Région</Label>
            <Input
              id="region"
              value={local.region}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              className="h-12 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
