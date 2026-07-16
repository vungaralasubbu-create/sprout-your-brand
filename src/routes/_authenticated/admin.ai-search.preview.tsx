import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/ai-search/preview")({
  component: Preview,
});

function Preview() {
  const [title, setTitle] = useState("What is Prompt Engineering? A 2026 Guide | Glintr");
  const [desc, setDesc] = useState("Learn how to write effective prompts for ChatGPT, Claude and Gemini. Techniques, examples and a step-by-step learning path.");
  const [url, setUrl] = useState("https://glintr.com/learn/prompt-engineering");

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Eye className="size-4 text-primary" /> Search Preview</h1>
        <p className="text-sm text-muted-foreground">Preview how a page appears in Google, an AI Overview, and social cards.</p>
      </header>
      <Card className="p-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Title" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Meta description" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="URL" />
      </Card>

      <Card className="p-5 bg-white">
        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Google Search</div>
        <div className="text-xs text-emerald-800 truncate">{url}</div>
        <div className="text-lg text-blue-800 hover:underline cursor-pointer truncate">{title}</div>
        <div className="text-sm text-muted-foreground line-clamp-2">{desc}</div>
      </Card>

      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="text-[10px] font-mono uppercase text-primary mb-2">AI Overview / Summary</div>
        <div className="text-sm">{desc}</div>
        <div className="text-[11px] text-muted-foreground mt-2">Cited from: {url}</div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="aspect-[1.91/1] bg-gradient-to-br from-primary/20 via-accent/10 to-lime/10 flex items-center justify-center text-xs text-muted-foreground">Social preview (og:image)</div>
        <div className="p-3">
          <div className="text-[11px] text-muted-foreground uppercase">glintr.com</div>
          <div className="text-sm font-semibold line-clamp-1">{title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
        </div>
      </Card>
    </div>
  );
}
