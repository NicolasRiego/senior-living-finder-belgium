import { useI18n, type Locale } from "@/modules/i18n/I18nProvider";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-0.5"
    >
      <Globe className="ml-1.5 h-4 w-4 text-muted-foreground" aria-hidden />
      {(["fr", "nl"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={
            "rounded-full px-2 py-1 text-xs font-semibold uppercase transition-colors " +
            (locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
