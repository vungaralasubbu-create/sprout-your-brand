import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGlossarySuggestions } from "@/lib/admin/content-intelligence.functions";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/glossary")({
  component: Glossary,
});

function Glossary() {
  const fn = useServerFn(getGlossarySuggestions);
  const { data, isLoading } = useQuery({ queryKey: ["ci-glossary"], queryFn: () => fn(), staleTime: 60_000 });

  const grouped: Record<string, { term: string; priority: string }[]> = {};
  for (const s of data?.suggestions ?? []) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><BookOpen className="size-4 text-primary" /> Glossary Expansion</h1>
        <p className="text-sm text-muted-foreground">Recommended new glossary terms grouped by category. Approve before creation.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h2 className="text-sm font-semibold mb-2 mt-4">{cat}</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <Link key={s.term} to={"/admin/ai-content/wizard" as any} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-white px-2.5 py-1.5 text-xs hover:border-primary/40">
                <span>{s.term}</span>
                {s.priority === "high" && <span className="rounded bg-rose-100 text-rose-700 text-[9px] font-mono uppercase px-1">Hi</span>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
