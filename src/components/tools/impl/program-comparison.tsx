import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard } from "@/components/tools/tool-shell";
import { getTool } from "@/data/tools";
import { listComparisons } from "@/data/comparisons";

const TOOL = getTool("program-comparison")!;

export function ProgramComparisonTool() {
  const comparisons = listComparisons();

  return (
    <ToolShell tool={TOOL} aiPrompt="Explain which side of a comparison suits a beginner better and why.">
      <ToolCard title="Pick a comparison">
        <p className="text-sm text-muted-foreground">
          Structured side-by-side comparisons across our curriculum. Each pair
          covers overview, skills, learning path and related programs.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {comparisons.map((c) => (
            <li key={c.slug}>
              <Link
                to="/compare/$slug"
                params={{ slug: c.slug }}
                className="block rounded-xl border border-border bg-background p-4 transition hover:border-primary hover:bg-primary/5"
              >
                <div className="text-caption text-muted-foreground">Comparison</div>
                <div className="mt-1 text-lg font-bold">{c.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.short}</div>
                <div className="mt-3 text-sm font-semibold text-primary">Open comparison →</div>
              </Link>
            </li>
          ))}
        </ul>
      </ToolCard>

      <ToolCard title="Not sure what to pick?">
        <p className="text-sm text-muted-foreground">
          Try the <Link to="/find-your-program" className="text-primary underline">Find Your Program</Link> quiz for a personalised recommendation, or explore the{" "}
          <Link to="/knowledge-graph" className="text-primary underline">Glintr Knowledge Graph</Link> to see how topics connect.
        </p>
      </ToolCard>
    </ToolShell>
  );
}
