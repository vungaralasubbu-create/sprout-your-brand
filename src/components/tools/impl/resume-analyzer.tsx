import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { analyzeResume } from "@/lib/tools/tools.functions";
import { getTool } from "@/data/tools";

const TOOL = getTool("resume-analyzer")!;

export function ResumeAnalyzer() {
  const [resume, setResume] = React.useState("");
  const [role, setRole] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof analyzeResume>> | null>(null);
  const call = useServerFn(analyzeResume);

  async function submit() {
    if (resume.trim().length < 40) {
      toast.error("Paste at least a few lines of your resume text.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await call({ data: { resumeText: resume, targetRole: role || undefined } });
      setResult(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell tool={TOOL} aiPrompt="Suggest three programs I should learn first based on this analysis.">
      <ToolCard
        title="Paste your resume text"
        footer={<Disclaimer>Educational tool only. No ATS score, no hiring promises. Your resume text is processed to compute the analysis and is not stored.</Disclaimer>}
      >
        <FieldLabel htmlFor="role">Target role (optional)</FieldLabel>
        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. AI Engineer" className="mt-2" />
        <div className="mt-4">
          <FieldLabel htmlFor="resume">Resume text</FieldLabel>
          <Textarea id="resume" rows={10} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume content here…" className="mt-2" />
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : "Analyze"}
          </Button>
        </div>
      </ToolCard>

      {result ? (
        <div className="mt-6 space-y-6">
          {result.summary ? (
            <ToolCard title="Summary">
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </ToolCard>
          ) : null}

          <ToolCard title="Detected skill signals">
            {result.detectedSkills.length ? (
              <div className="flex flex-wrap gap-2">
                {result.detectedSkills.map((s) => <span key={s} className="rounded-full bg-background px-3 py-1 text-sm border border-border">{s}</span>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">No clear skill signals detected. Add more detail to your resume text.</p>}
          </ToolCard>

          <ToolCard title="Missing / recommended skills">
            {result.missingSkills.length ? (
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {result.missingSkills.map((s) => <li key={s} className="rounded-lg bg-background p-3 border border-border">{s}</li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Nothing obvious missing — great foundation.</p>}
          </ToolCard>

          <ToolCard title="Learning suggestions">
            <ul className="grid gap-1 text-sm">
              {result.learningSuggestions.map((s) => <li key={s}>• {s}</li>)}
            </ul>
          </ToolCard>

          <ToolCard title="Recommended Glintr programs">
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
        </div>
      ) : null}
    </ToolShell>
  );
}
