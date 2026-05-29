import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  format?: (n: number) => string;
  label?: React.ReactNode;
  className?: string;
};

const defaultFormat = (n: number) => `${n.toLocaleString("fr-BE")}€`;

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  format = defaultFormat,
  label,
  className,
}: RangeSliderProps) {
  const handle = (v: number[]) => {
    const [a, b] = v;
    onValueChange([Math.min(a, b), Math.max(a, b)]);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <div className="mb-2 block text-sm font-medium">{label}</div>}
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-primary">
        <span>{format(value[0])}</span>
        <span className="text-muted-foreground">—</span>
        <span>{format(value[1])}</span>
      </div>
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={handle}
        minStepsBetweenThumbs={1}
        className="relative flex w-full touch-none select-none items-center py-2"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {[0, 1].map((i) => (
          <SliderPrimitive.Thumb
            key={i}
            aria-label={i === 0 ? "Minimum" : "Maximum"}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-soft ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
}
