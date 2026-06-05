import { memo } from "react";
import { Mail, Phone, MapPin, Calendar, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadStatusBadge, LeadTypeBadge } from "@/modules/leads/components/LeadStatusBadge";
import { isOverdueSla, timeAgo, type LeadType } from "@/modules/leads/labels";
import type { LeadRow } from "@/modules/leads/api";

type Props = {
  lead: LeadRow;
  showResidence?: boolean;
  onAction?: (status: "pris_en_charge" | "visite_planifiee" | "converti" | "perdu") => void;
  onOpen?: () => void;
  busy?: boolean;
};

export const LeadCard = memo(function LeadCard({ lead, showResidence = true, onAction, onOpen, busy }: Props) {
  const overdue = isOverdueSla(lead.status, lead.created_at);
  const name = `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim() || lead.contact_name;
  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 transition hover:shadow-sm",
      overdue ? "border-destructive/40 bg-destructive/5" : "border-border/60",
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <LeadTypeBadge type={lead.type as LeadType} />
            <LeadStatusBadge status={lead.status} />
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" /> En attente +24h
              </span>
            )}
          </div>
          <button onClick={onOpen} className="block text-left">
            <div className="text-base font-semibold hover:underline">{name}</div>
          </button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {lead.contact_email}</span>
            {lead.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {lead.contact_phone}</span>}
            {showResidence && lead.residences?.nom_fr && (
              <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {lead.residences.nom_fr}</span>
            )}
          </div>
          {lead.preferred_date && (
            <div className="inline-flex items-center gap-1 text-sm text-foreground">
              <Calendar className="h-3.5 w-3.5" /> Souhaite le {new Date(lead.preferred_date).toLocaleDateString("fr-BE")}
              {lead.preferred_time && <span className="text-muted-foreground"> ({lead.preferred_time.replace("_", " ")})</span>}
            </div>
          )}
          {lead.source_page && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {lead.source_page}
            </div>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">{timeAgo(lead.created_at)}</div>
      </div>

      {lead.message && (
        <div className="mt-3 rounded-md bg-muted/40 p-2.5 text-sm whitespace-pre-line">{lead.message}</div>
      )}

      {onAction && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("pris_en_charge")}>✓ Prendre en charge</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("visite_planifiee")}>🗓 Planifier visite</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("converti")} className="border-green-600/40 text-green-700 hover:bg-green-50">✓ Converti</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onAction("perdu")}>Marquer perdu</Button>
        </div>
      )}
    </div>
  );
});
