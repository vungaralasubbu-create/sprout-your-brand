import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";
import { generateInterviewQuestions } from "@/lib/tools/tools.functions";
import { getTool } from "@/data/tools";

const TOOL = getTool("interview-questions")!;
const DIFFICULTIES = ["foundational", "intermediate", "advanced"] as const;

export function InterviewQuestions() {
  const [topic, setTopic] = React.useState("Machine Learning");
  const [difficulty, setDifficulty] = React.useState<(typeof DIFFICULTIES)[number]>("intermediate");
  const [count, setCount] = React.useState(6);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof generateInterviewQuestions>> | null>(null);
  const call = useServerFn(generateInterviewQuestions);

  async function submit() {
    if (topic.trim().length < 2) return;
    setBusy(true); setResult(null);
    try {
      const r = await call({ data: { topic, difficulty, count } });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell tool={TOOL} aiPrompt="Give me a study plan to answer these confidently in two weeks.">
      <ToolCard title="Choose topic and difficulty" footer={<Disclaimer>Questions are for practice only. They are not tied to any employer and do not predict hiring outcomes.</Disclaimer>}>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <FieldLabel htmlFor="topic">Topic</FieldLabel>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Machine Learning, React, VLSI" className="mt-2" />
          </div>
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <div className="mt-2 flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={"rounded-full border px-3 py-1 text-sm " + (d === difficulty ? "border-primary bg-primary/10 text-primary" : "border-border")}
                >{d}</button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="count">How many questions?</FieldLabel>
            <Input id="count" type="number" min={3} max={10} value={count} onChange={(e) => setCount(Math.max(3, Math.min(10, Number(e.target.value) || 6)))} className="mt-2" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : "Generate questions"}
          </Button>
        </div>
      </ToolCard>

      {result ? (
        <div className="mt-6 space-y-3">
          {result.questions.map((q, i) => (
            <details key={i} className="group rounded-2xl border border-border bg-surface p-5 open:bg-background">
              <summary className="flex cursor-pointer items-start justify-between gap-3 text-left">
                <div>
                  <div className="text-caption text-muted-foreground">Question {i + 1} · {q.concept || topic}</div>
                  <div className="mt-1 font-semibold">{q.question}</div>
                </div>
                <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{q.explanation}</p>
            </details>
          ))}

          {result.recommendedPrograms.length ? (
            <ToolCard title="Related Glintr programs">
              <div className="flex flex-wrap gap-2">
                {result.recommendedPrograms.map((p) => (
                  <span key={p} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{p.replace(/-/g, " ")}</span>
                ))}
              </div>
              {result.relatedGlossary.length ? (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="text-muted-foreground">Glossary:</span>
                  {result.relatedGlossary.map((g) => (
                    <Link key={g} to="/glossary/$slug" params={{ slug: g }} className="text-primary hover:underline">{g.replace(/-/g, " ")}</Link>
                  ))}
                </div>
              ) : null}
            </ToolCard>
          ) : null}
        </div>
      ) : null}
    </ToolShell>
  );
}
