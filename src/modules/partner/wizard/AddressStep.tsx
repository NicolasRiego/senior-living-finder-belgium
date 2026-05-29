import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRegisterWizardStep } from "@/modules/partner/WizardSaveContext";
import { StepProps } from "@/pages/partner/ResidenceEditor";

type Row = {
  code_postal: string;
  commune_fr: string;
  ville_fr: string;
  province: string;
  region: string;
};

type FieldKey = "code_postal" | "commune" | "ville" | "province" | "region";

const normalize = (s: string) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const uniqBy = <T, K>(arr: T[], key: (t: T) => K): T[] => {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
};

export default function AddressStep({ residence, onChange }: StepProps) {
  const initialValues = useRef({
    adresse: residence.adresse ?? "",
    code_postal: residence.code_postal ?? "",
    commune: (residence as any).commune ?? "",
    ville: residence.ville ?? "",
    province: residence.province ?? "",
    region: residence.region ?? "",
  });

  const [local, setLocal] = useState({ ...initialValues.current });
  // Track which fields were auto-filled by a cascade selection (cleared on manual edit)
  const [autoFilled, setAutoFilled] = useState<Record<FieldKey, boolean>>({
    code_postal: false,
    commune: false,
    ville: false,
    province: false,
    region: false,
  });

  // Full dataset cached client-side for filtering / cascading.
  const [allRows, setAllRows] = useState<Row[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load full table in pages of 1000 (be_postal_codes is small, ~2.7k rows)
      const pageSize = 1000;
      let from = 0;
      const acc: Row[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("be_postal_codes" as any)
          .select("code_postal,commune_fr,ville_fr,province,region")
          .order("code_postal")
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        acc.push(...(data as unknown as Row[]));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      if (!cancelled) setAllRows(acc);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    JSON.stringify(local) !== JSON.stringify(initialValues.current);

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
    initialValues.current = { ...v };
    setAutoFilled({
      code_postal: false,
      commune: false,
      ville: false,
      province: false,
      region: false,
    });
    onChange(v as any);
  }, [local, residence.id, onChange]);

  const reset = useCallback(() => {
    setLocal({ ...initialValues.current });
    setAutoFilled({
      code_postal: false,
      commune: false,
      ville: false,
      province: false,
      region: false,
    });
  }, []);

  useRegisterWizardStep("address", { isDirty, save, reset });

  // Cascading filtered datasets based on current selection
  const rowsForRegion = useMemo(
    () =>
      local.region
        ? allRows.filter((r) => r.region === local.region)
        : allRows,
    [allRows, local.region],
  );
  const rowsForProvince = useMemo(
    () =>
      local.province
        ? rowsForRegion.filter((r) => r.province === local.province)
        : rowsForRegion,
    [rowsForRegion, local.province],
  );
  const rowsForVille = useMemo(
    () =>
      local.ville
        ? rowsForProvince.filter((r) => r.ville_fr === local.ville)
        : rowsForProvince,
    [rowsForProvince, local.ville],
  );
  const rowsForCommune = useMemo(
    () =>
      local.commune
        ? rowsForVille.filter((r) => r.commune_fr === local.commune)
        : rowsForVille,
    [rowsForVille, local.commune],
  );

  // Cascade fill helpers: choosing a value at a level fills parents and clears children if mismatched
  const pickRegion = (region: string) => {
    setLocal((s) => ({
      ...s,
      region,
      province: s.province && allRows.some((r) => r.region === region && r.province === s.province) ? s.province : "",
      ville: "",
      commune: "",
      code_postal: "",
    }));
    setAutoFilled((a) => ({ ...a, region: false, province: false, ville: false, commune: false, code_postal: false }));
  };

  const pickProvince = (province: string) => {
    const sample = allRows.find((r) => r.province === province);
    setLocal((s) => ({
      ...s,
      province,
      region: sample?.region ?? s.region,
      ville: "",
      commune: "",
      code_postal: "",
    }));
    setAutoFilled((a) => ({ ...a, province: false, region: true, ville: false, commune: false, code_postal: false }));
  };

  const pickVille = (ville: string) => {
    const sample = allRows.find((r) => r.ville_fr === ville);
    setLocal((s) => ({
      ...s,
      ville,
      province: sample?.province ?? s.province,
      region: sample?.region ?? s.region,
      commune: "",
      code_postal: "",
    }));
    setAutoFilled((a) => ({ ...a, ville: false, province: true, region: true, commune: false, code_postal: false }));
  };

  const pickCommune = (commune: string, ville?: string) => {
    const sample = allRows.find(
      (r) => r.commune_fr === commune && (!ville || r.ville_fr === ville),
    ) ?? allRows.find((r) => r.commune_fr === commune);
    setLocal((s) => ({
      ...s,
      commune,
      ville: sample?.ville_fr ?? s.ville,
      province: sample?.province ?? s.province,
      region: sample?.region ?? s.region,
      code_postal: sample?.code_postal ?? "",
    }));
    setAutoFilled((a) => ({ ...a, commune: false, ville: true, province: true, region: true, code_postal: true }));
  };

  const pickCodePostal = (row: Row) => {
    setLocal((s) => ({
      ...s,
      code_postal: row.code_postal,
      commune: row.commune_fr,
      ville: row.ville_fr,
      province: row.province,
      region: row.region,
    }));
    setAutoFilled((a) => ({ ...a, code_postal: false, commune: true, ville: true, province: true, region: true }));
  };

  const manualChange = (field: FieldKey, value: string) => {
    setLocal((s) => ({ ...s, [field]: value }));
    setAutoFilled((a) => ({ ...a, [field]: false }));
  };

  const resetAddress = () => {
    setLocal((s) => ({
      ...s,
      code_postal: "",
      commune: "",
      ville: "",
      province: "",
      region: "",
    }));
    setAutoFilled({
      code_postal: false,
      commune: false,
      ville: false,
      province: false,
      region: false,
    });
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
            onChange={(e) => manualChange("adresse" as any, e.target.value)}
            placeholder="ex: Rue de la Paix 12, bte 3"
            className="h-12"
          />
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Remplissez n'importe quel champ : les autres se complètent
              automatiquement.
            </p>
            <button
              type="button"
              onClick={resetAddress}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Réinitialiser l'adresse
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AutocompleteField
              id="region"
              label="Région"
              placeholder="Tapez ou choisissez..."
              value={local.region}
              autoFilled={autoFilled.region}
              options={uniqBy(allRows, (r) => r.region)
                .map((r) => r.region)
                .filter(Boolean)
                .sort()}
              onManualChange={(v) => manualChange("region", v)}
              onPick={(v) => pickRegion(v)}
            />

            <AutocompleteField
              id="province"
              label="Province"
              placeholder="Tapez ou choisissez..."
              value={local.province}
              autoFilled={autoFilled.province}
              options={uniqBy(rowsForRegion, (r) => r.province)
                .map((r) => r.province)
                .filter(Boolean)
                .sort()}
              onManualChange={(v) => manualChange("province", v)}
              onPick={(v) => pickProvince(v)}
            />

            <AutocompleteField
              id="ville"
              label="Ville *"
              placeholder="Tapez ou choisissez..."
              value={local.ville}
              autoFilled={autoFilled.ville}
              options={uniqBy(rowsForProvince, (r) => r.ville_fr)
                .map((r) => r.ville_fr)
                .filter(Boolean)
                .sort()}
              onManualChange={(v) => manualChange("ville", v)}
              onPick={(v) => pickVille(v)}
            />

            <AutocompleteField
              id="commune"
              label="Commune *"
              placeholder="Tapez ou choisissez..."
              value={local.commune}
              autoFilled={autoFilled.commune}
              options={uniqBy(rowsForVille, (r) => r.commune_fr)
                .map((r) => r.commune_fr)
                .filter(Boolean)
                .sort()}
              onManualChange={(v) => manualChange("commune", v)}
              onPick={(v) => pickCommune(v, local.ville)}
            />

            <PostalCodeField
              value={local.code_postal}
              autoFilled={autoFilled.code_postal}
              rows={rowsForCommune}
              allRows={allRows}
              onManualChange={(v) => manualChange("code_postal", v)}
              onPick={pickCodePostal}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Pour Bruxelles-Capitale, la ville est toujours "Bruxelles". La
            commune précise est indiquée dans le champ "Commune".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Generic autocomplete field for text columns ---------- */

function AutocompleteField({
  id,
  label,
  placeholder,
  value,
  options,
  autoFilled,
  onManualChange,
  onPick,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  autoFilled: boolean;
  onManualChange: (v: string) => void;
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = normalize(value);
  const filtered = useMemo(() => {
    const list = q.length >= 2 ? options.filter((o) => normalize(o).includes(q)) : options;
    return list.slice(0, 10);
  }, [options, q]);

  return (
    <div className="space-y-2" ref={wrapRef}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            onManualChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "h-12 pl-9",
            autoFilled && "bg-green-50 dark:bg-green-950/30",
          )}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Postal code field (numeric, cascades to all parents) ---------- */

function PostalCodeField({
  value,
  rows,
  allRows,
  autoFilled,
  onManualChange,
  onPick,
}: {
  value: string;
  rows: Row[];
  allRows: Row[];
  autoFilled: boolean;
  onManualChange: (v: string) => void;
  onPick: (r: Row) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = normalize(value);
  const filtered = useMemo(() => {
    // If filtered rows are constrained (commune chosen), show those; otherwise search across all
    const base = rows.length > 0 && rows.length < allRows.length ? rows : allRows;
    const list =
      q.length >= 1
        ? base.filter(
            (r) =>
              r.code_postal.startsWith(q) ||
              normalize(r.commune_fr).includes(q) ||
              normalize(r.ville_fr).includes(q),
          )
        : base;
    return uniqBy(list, (r) => r.code_postal + "|" + r.commune_fr).slice(0, 10);
  }, [rows, allRows, q]);

  return (
    <div className="space-y-2" ref={wrapRef}>
      <Label htmlFor="cp">Code postal *</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="cp"
          value={value}
          onChange={(e) => {
            onManualChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ex. 1180"
          autoComplete="off"
          className={cn(
            "h-12 pl-9",
            autoFilled && "bg-green-50 dark:bg-green-950/30",
          )}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {filtered.map((r) => (
              <button
                key={r.code_postal + r.commune_fr}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex justify-between items-center"
                onClick={() => {
                  onPick(r);
                  setOpen(false);
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
  );
}
