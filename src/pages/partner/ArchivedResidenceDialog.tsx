import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Undo2 } from "lucide-react";

type Props = {
  residenceId: string | null;
  open: boolean;
  onClose: () => void;
  onRestore: (id: string) => Promise<void> | void;
};

const Empty = () => (
  <span className="text-muted-foreground italic">—</span>
);
const Missing = ({ label = "Non renseigné" }: { label?: string }) => (
  <span className="text-muted-foreground italic">{label}</span>
);

const Field = ({
  label,
  value,
  missingLabel,
}: {
  label: string;
  value: React.ReactNode;
  missingLabel?: string;
}) => (
  <div className="grid grid-cols-2 gap-2 py-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium break-words">
      {value !== null && value !== undefined && value !== ""
        ? value
        : missingLabel
        ? <Missing label={missingLabel} />
        : <Empty />}
    </span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-lg border-b mb-3 pb-1">{children}</h3>
);

export function ArchivedResidenceDialog({
  residenceId,
  open,
  onClose,
  onRestore,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [completeness, setCompleteness] = useState<number>(0);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!open || !residenceId) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: res }, { data: c }] = await Promise.all([
        supabase
          .from("residences")
          .select(
            "*, residence_services(*, services_catalog(*)), unit_types(*), photos(*)",
          )
          .eq("id", residenceId)
          .maybeSingle(),
        supabase.rpc("residence_completeness", { _residence_id: residenceId }),
      ]);
      if (cancelled) return;
      setData(res);
      setCompleteness((c as number) ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, residenceId]);

  const handleRestore = async () => {
    if (!residenceId) return;
    setRestoring(true);
    await onRestore(residenceId);
    setRestoring(false);
    onClose();
  };

  const photos = (data?.photos ?? []) as any[];
  const units = (data?.unit_types ?? []) as any[];
  const services = (data?.residence_services ?? []) as any[];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-8">
            <span className="font-display text-xl">
              {loading ? "Chargement…" : data?.nom_fr ?? "Résidence"}
            </span>
            <Badge variant="secondary">Archivée</Badge>
          </DialogTitle>
          {data?.deleted_at && (
            <p className="text-sm text-muted-foreground">
              Supprimée le{" "}
              {new Date(data.deleted_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !data ? (
            <p className="text-muted-foreground italic">
              Données introuvables.
            </p>
          ) : (
            <>
              <section>
                <SectionTitle>Informations générales</SectionTitle>
                <Field label="Nom FR" value={data.nom_fr} />
                <Field label="Nom NL" value={data.nom_nl} />
                <Field
                  label="Type"
                  value={data.type_etablissement?.replace(/_/g, " ")}
                />
                <Field
                  label="Description"
                  value={data.description_fr}
                  missingLabel="Non renseignée"
                />
              </section>

              <section>
                <SectionTitle>Localisation</SectionTitle>
                <Field label="Adresse" value={data.adresse} />
                <Field label="Code postal" value={data.code_postal} />
                <Field label="Ville" value={data.ville} />
                <Field label="Province" value={data.province} />
                <Field label="Région" value={data.region} />
              </section>

              <section>
                <SectionTitle>Contact</SectionTitle>
                <Field label="Email" value={data.contact_email} />
                <Field label="Téléphone" value={data.contact_phone} />
                <Field label="Site web" value={data.website} />
              </section>

              <section>
                <SectionTitle>
                  Logements ({units.length} type{units.length > 1 ? "s" : ""}{" "}
                  défini{units.length > 1 ? "s" : ""})
                </SectionTitle>
                {units.length === 0 ? (
                  <Missing label="Aucun type de logement défini" />
                ) : (
                  <ul className="space-y-1 text-sm">
                    {units.map((u) => (
                      <li key={u.id} className="flex justify-between gap-2">
                        <span className="font-medium">{u.type}</span>
                        <span className="text-muted-foreground">
                          {u.surface_min ?? "?"}–{u.surface_max ?? "?"} m² ·{" "}
                          {u.count_total} unité{u.count_total > 1 ? "s" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <SectionTitle>
                  Services ({services.length})
                </SectionTitle>
                {services.length === 0 ? (
                  <Missing label="Aucun service défini" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <Badge key={s.id} variant="outline">
                        {s.services_catalog?.label_fr ?? "Service"}
                        {s.included ? " · inclus" : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <SectionTitle>Photos ({photos.length})</SectionTitle>
                {photos.length === 0 ? (
                  <Missing label="Aucune photo uploadée" />
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((p) => {
                      const url = supabase.storage
                        .from("residence-photos")
                        .getPublicUrl(p.storage_path).data.publicUrl;
                      return (
                        <img
                          key={p.id}
                          src={url}
                          alt={p.alt_text ?? ""}
                          className="aspect-square w-full rounded object-cover bg-muted"
                          loading="lazy"
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <SectionTitle>Complétude</SectionTitle>
                <div className="flex items-center gap-3">
                  <Progress value={completeness} className="flex-1" />
                  <span className="font-semibold text-sm">
                    {completeness}%
                  </span>
                </div>
              </section>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleRestore} disabled={restoring || loading}>
            <Undo2 className="h-4 w-4 mr-2" />
            Restaurer cette fiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
