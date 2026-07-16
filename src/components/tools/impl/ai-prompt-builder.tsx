import * as React from "react";
import { toast } from "sonner";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { getTool } from "@/data/tools";

const TOOL = getTool("ai-prompt-builder")!;

const CATEGORIES = ["Learning", "Research", "Writing", "Coding", "Marketing", "Business", "Education"] as const;
const TONES = ["Neutral", "Friendly", "Formal", "Technical", "Persuasive"];
const OUTPUT_TYPES = ["Structured list", "Step-by-step guide", "Table / comparison", "Long-form article", "Short summary", "Code snippet"];
const LENGTHS = ["Short (≤150 words)", "Medium (~400 words)", "Long (~900 words)"];

function build({ category, goal, tone, output, length, context, audience, constraints }: Record<string, string>) {
  return [
    `# ${category} Task`,
    "",
    "## Role",
    `You are an expert ${category.toLowerCase()} assistant.`,
    "",
    "## Goal",
    goal || "(describe the goal)",
    "",
    audience ? `## Audience\n${audience}\n` : "",
    "## Context",
    context || "(paste any relevant background)",
    "",
    "## Output requirements",
    `- Format: ${output}`,
    `- Tone: ${tone}`,
    `- Length: ${length}`,
    constraints ? `- Constraints: ${constraints}` : "",
    "",
    "## Guardrails",
    "- Do not fabricate facts or citations.",
    "- If information is missing, ask a clarifying question first.",
    "- Refuse anything unsafe, illegal or personal-data-related.",
    "",
    "## Response",
    "Return the answer only, in the requested format.",
  ].filter(Boolean).join("\n");
}

const UNSAFE = /(bypass|jailbreak|hack|exploit|phish|malware|explosive|weapon|kill|self[-\s]?harm|suicide|nud(?:e|ity)|porn|csam|steal cred|extract api key)/i;

export function AiPromptBuilder() {
  const [category, setCategory] = React.useState<string>("Learning");
  const [goal, setGoal] = React.useState("");
  const [tone, setTone] = React.useState(TONES[0]);
  const [output, setOutput] = React.useState(OUTPUT_TYPES[0]);
  const [length, setLength] = React.useState(LENGTHS[1]);
  const [context, setContext] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [constraints, setConstraints] = React.useState("");

  const unsafe = UNSAFE.test(`${goal} ${context} ${constraints}`);
  const prompt = React.useMemo(
    () => build({ category, goal, tone, output, length, context, audience, constraints }),
    [category, goal, tone, output, length, context, audience, constraints],
  );

  async function copy() {
    if (unsafe) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Could not copy. Select the text manually.");
    }
  }

  return (
    <ToolShell tool={TOOL} aiPrompt="Refine this prompt for a beginner audience.">
      <ToolCard title="Configure your prompt">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>Category</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    "rounded-full border px-3 py-1 text-sm " +
                    (c === category ? "border-primary bg-primary/10 text-primary" : "border-border")
                  }
                >{c}</button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="goal">Goal</FieldLabel>
            <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Explain generative AI to a marketing manager" className="mt-2" />
          </div>
          <div>
            <FieldLabel>Tone</FieldLabel>
            <select className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Output type</FieldLabel>
            <select className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" value={output} onChange={(e) => setOutput(e.target.value)}>
              {OUTPUT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Length</FieldLabel>
            <select className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTHS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="audience">Audience (optional)</FieldLabel>
            <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="First-year engineering student" className="mt-2" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="context">Context (optional)</FieldLabel>
            <Textarea id="context" rows={4} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any background the model should know" className="mt-2" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="constraints">Constraints (optional)</FieldLabel>
            <Input id="constraints" value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Avoid jargon; include one example" className="mt-2" />
          </div>
        </div>
      </ToolCard>

      <ToolCard
        title="Generated prompt"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={copy} disabled={unsafe}>
              <Copy className="mr-2 h-4 w-4" /> Copy prompt
            </Button>
            <Disclaimer>Prompts are templates for personal use. Do not paste sensitive personal, financial or medical data into public AI models.</Disclaimer>
          </div>
        }
      >
        {unsafe ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Your inputs look like they may target unsafe or harmful use. Please rephrase.
          </p>
        ) : (
          <pre className="max-h-[420px] overflow-auto rounded-xl border border-border bg-background p-4 text-xs leading-relaxed whitespace-pre-wrap">{prompt}</pre>
        )}
      </ToolCard>
    </ToolShell>
  );
}
