import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/summaries")({
  component: Summaries,
});

const BLOCKS = [
  { name: "Quick Summary", desc: "2–3 sentence plain-language description of what the page teaches.", required: true },
  { name: "Key Takeaways", desc: "3–6 bullet points capturing the essential concepts.", required: true },
  { name: "Who Should Learn This", desc: "Target reader — role, level, industry.", required: true },
  { name: "Estimated Learning Time", desc: "Realistic reading/practice time in hours.", required: true },
  { name: "Prerequisites", desc: "Concepts or skills the reader should already know.", required: false },
  { name: "Related Skills", desc: "Skills learners will build.", required: false },
  { name: "Career Relevance", desc: "Roles and industries where this matters.", required: false },
];

function Summaries() {
  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI Summary Blocks</h1>
        <p className="text-sm text-muted-foreground">The canonical opening blocks for every educational page. Human-written, AI-friendly.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BLOCKS.map((b) => (
          <Card key={b.name} className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">{b.name}</div>
              {b.required && <span className="rounded bg-primary/10 text-primary text-[10px] font-mono px-1.5 py-0.5">REQUIRED</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{b.desc}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4 text-xs text-muted-foreground">
        Never generate misleading summaries or unsupported claims. Summaries must be extracted from — not invented for — the article body.
      </Card>
    </div>
  );
}
