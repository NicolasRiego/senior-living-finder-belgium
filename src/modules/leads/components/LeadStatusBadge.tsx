import { memo } from "react";
import { cn } from "@/lib/utils";
import { statusMeta, typeMeta, type LeadType } from "@/modules/leads/labels";

export const LeadStatusBadge = memo(function LeadStatusBadge({ status, className }: { status: string | null; className?: string }) {
  const m = statusMeta(status);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", m.chip, className)}>
      {m.label}
    </span>
  );
});

export const LeadTypeBadge = memo(function LeadTypeBadge({ type, className }: { type: LeadType | null; className?: string }) {
  const m = typeMeta(type);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", m.chip, className)}>
      <span aria-hidden>{m.icon}</span> {m.label}
    </span>
  );
});
