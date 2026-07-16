import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLlmsConfig } from "@/lib/admin/ai-search.functions";
import { Card } from "@/components/ui/card";
import { FileText, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/llm/")({
  component: LlmsView,
});

function LlmsView() {
  const fn = useServerFn(getLlmsConfig);
  const { data } = useQuery({ queryKey: ["llms-config"], queryFn: () => fn(), staleTime: 60_000 });
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch("/llms.txt").then((r) => r.text()).then(setContent).catch(() => setContent(""));
  }, []);

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><FileText className="size-4 text-primary" /> /llms.txt</h1>
        <p className="text-sm text-muted-foreground">Canonical map of Glintr's public content for LLM crawlers. Auto-updated as new pages are published.</p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-emerald-100 text-emerald-700 px-2 py-1 font-mono">Live at /llms.txt</span>
        <span className="rounded bg-primary/10 text-primary px-2 py-1 font-mono">{data?.publishedContent ?? 0} published items indexed</span>
        <a href="/llms.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-surface-2">
          Open <ExternalLink className="size-3" />
        </a>
      </div>

      <Card className="p-0">
        <pre className="text-xs font-mono p-4 whitespace-pre-wrap max-h-[60vh] overflow-auto leading-relaxed">
{content || "Loading /llms.txt…"}
        </pre>
      </Card>
    </div>
  );
}
