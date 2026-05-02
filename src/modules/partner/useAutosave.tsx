import { useEffect, useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export function useAutosave<T extends object>(
  value: T,
  save: (v: T) => Promise<void>,
  opts: { delay?: number; enabled?: boolean } = {},
) {
  const { delay = 800, enabled = true } = opts;
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>();
  const first = useRef(true);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await save(latest.current);
        setStatus("saved");
        window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch {
        setStatus("error");
      }
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), enabled]);

  return { status };
}

export function AutosaveBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    idle: "Tous les changements enregistrés",
    saving: "Enregistrement…",
    saved: "✓ Enregistré",
    error: "⚠ Erreur d'enregistrement",
  };
  const tone =
    status === "error"
      ? "text-destructive"
      : status === "saving"
        ? "text-muted-foreground"
        : "text-muted-foreground";
  return <span className={`text-sm ${tone}`}>{map[status]}</span>;
}
