import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  triggerClassName?: string;
};

/**
 * Lightweight controlled dropdown:
 * - click-to-toggle only (no hover)
 * - close on outside click / Escape
 * - independent of any scroll/visibility logic
 * - high z-index (9999) for the panel
 */
export function AdminDropdown({ label, icon, children, align = "left", triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
          open && "bg-muted text-primary",
          triggerClassName,
        )}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-70 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          style={{ zIndex: 9999 }}
          className={cn(
            "absolute mt-2 min-w-[14rem] rounded-md border bg-popover p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

type ItemProps = {
  onSelect: () => void;
  icon?: ReactNode;
  children: ReactNode;
};

export function AdminDropdownItem({ onSelect, icon, children }: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-left hover:bg-muted focus:bg-muted focus:outline-none"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
