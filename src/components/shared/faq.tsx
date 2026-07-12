import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-all overflow-hidden",
              isOpen ? "border-primary/40 bg-primary-soft/40 shadow-sm" : "border-border bg-card",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between text-left px-5 py-4 gap-4"
              aria-expanded={isOpen}
            >
              <span className="font-medium">{item.question}</span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full shrink-0 transition-colors",
                  isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-muted-foreground text-pretty leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
