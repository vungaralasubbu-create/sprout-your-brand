import { useState } from "react";
import { BLOCK_GROUPS } from "@/lib/automation/blocks";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function BlockPalette() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocks…" className="h-8 pl-7 text-xs" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {BLOCK_GROUPS.map((g) => {
          const items = g.blocks.filter((b) => !query || b.label.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));
          if (!items.length) return null;
          return (
            <div key={g.key}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{g.label}</div>
              <div className="space-y-1.5">
                {items.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("application/glintr-block", b.id); e.dataTransfer.effectAllowed = "copy"; }}
                    className="cursor-grab active:cursor-grabbing rounded-md border border-border/60 bg-white px-2.5 py-2 hover:border-primary hover:shadow-sm transition"
                  >
                    <div className="text-xs font-semibold leading-tight">{b.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{b.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
