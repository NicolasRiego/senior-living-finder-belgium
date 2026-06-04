import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, type CrmContactStatus } from "./types";

export function StatusBadge({ status, className }: { status: CrmContactStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_COLORS[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: "groupe" | "residence_independante" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        type === "groupe"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
          : "bg-muted text-muted-foreground",
      )}
    >
      {type === "groupe" ? "Groupe" : "Résidence"}
    </Badge>
  );
}

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}
