import { FontSize, useFontSize } from "./FontSizeContext";
import { cn } from "@/lib/utils";

interface SizeOption {
  value: FontSize;
  label: string;
  ariaLabel: string;
  textClass: string;
}

const OPTIONS: SizeOption[] = [
  { value: "normal", label: "A", ariaLabel: "Taille de texte normale", textClass: "text-base" },
  { value: "large", label: "A+", ariaLabel: "Taille de texte large", textClass: "text-lg" },
  { value: "xlarge", label: "A++", ariaLabel: "Taille de texte très large", textClass: "text-xl" },
];

interface FontSizeControlsProps {
  className?: string;
}

export function FontSizeControls({ className }: FontSizeControlsProps) {
  const { size, setSize } = useFontSize();

  return (
    <div
      role="group"
      aria-label="Réglage de la taille du texte"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = size === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSize(opt.value)}
            aria-label={opt.ariaLabel}
            aria-pressed={active}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center whitespace-nowrap rounded-full px-2.5 font-semibold leading-none transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              opt.textClass,
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
