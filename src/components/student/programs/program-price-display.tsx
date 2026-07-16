import { cn } from "@/lib/utils";
import type { PricingDisplay } from "@/lib/programs";
import { IndianRupee, Sparkles } from "lucide-react";

/**
 * Reusable pricing display block. Renders formatted current price, original
 * price + savings pill and EMI hint when available. Callers pass a
 * `PricingDisplay` produced by `resolvePricingDisplay()` — never hard-coded.
 */
export function ProgramPriceDisplay({
  pricing,
  size = "md",
  align = "left",
  className,
}: {
  pricing: PricingDisplay | null | undefined;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  className?: string;
}) {
  if (!pricing) return null;
  const priceCls =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg";

  if (pricing.mode !== "starting-from") {
    return (
      <div className={cn(align === "center" && "text-center", className)}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {pricing.label}
        </div>
        {pricing.note && (
          <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
            {pricing.note}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {pricing.label}
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <div className={cn("font-display font-semibold leading-none", priceCls)}>
          {pricing.value}
        </div>
        {pricing.original && (
          <div className="text-[12px] text-muted-foreground line-through">
            {pricing.original}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {pricing.savingsLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">
            <IndianRupee className="size-3" /> {pricing.savingsLabel}
          </span>
        )}
        {pricing.emiFrom && (
          <span className="text-[11px] text-muted-foreground">{pricing.emiFrom}</span>
        )}
        {pricing.scholarship && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">
            <Sparkles className="size-3" /> Scholarship
          </span>
        )}
      </div>
    </div>
  );
}
