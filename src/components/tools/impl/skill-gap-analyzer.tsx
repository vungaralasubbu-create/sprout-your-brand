import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTool } from "@/data/tools";

const TOOL = getTool("skill-gap-analyzer")!;

const ROLES: Record<string, { required: string[]; programs: string[]; glossary: string[] }> = {
  "AI Engineer": {
    required: ["Python", "Machine Learning", "Deep Learning", "PyTorch or TensorFlow", "LLMs", "Prompt Engineering", "Data pipelines", "Git"],
    programs: ["artificial-intelligence", "chatgpt", "python", "machine-learning"],
    glossary: ["artificial-intelligence", "machine-learning", "deep-learning", "prompt-engineering"],
  },
  "Prompt Engineer": {
    required: ["Prompt Engineering", "ChatGPT", "Claude", "Gemini", "RAG basics", "Evaluation frameworks", "Domain writing"],
    programs: ["chatgpt", "claude-ai", "gemini-ai"],
    glossary: ["prompt-engineering", "chatgpt", "claude", "gemini"],
  },
  "Full-Stack Web Developer": {
    required: ["HTML", "CSS", "JavaScript", "React", "Node.js", "REST APIs", "Databases", "Git", "Deployment"],
    programs: ["web-development", "react", "javascript"],
    glossary: ["html", "css", "javascript", "react", "node-js"],
  },
  "VLSI Design Engineer": {
    required: ["Digital Design", "Verilog", "SystemVerilog", "UVM", "RTL Design", "STA basics", "Synthesis"],
    programs: ["vlsi"],
    glossary: ["vlsi"],
  },
  "Embedded Engineer": {
    required: ["C programming", "ARM Cortex", "RTOS", "Peripherals", "Communication protocols", "Debugging"],
    programs: ["embedded-systems"],
    glossary: ["embedded-systems", "iot"],
  },
  "Digital Marketer": {
    required: ["SEO", "Content strategy", "Google Analytics", "Paid social", "Email marketing", "Attribution"],
    programs: ["digital-marketing", "seo", "social-media-marketing"],
    glossary: ["seo", "social-media-marketing"],
  },
  "Financial Analyst": {
    required: ["Excel", "Accounting", "Financial modelling", "Valuation", "Corporate finance", "Presentation"],
    programs: ["financial-modelling", "investment-banking"],
    glossary: ["financial-modelling"],
  },
  "Medical Coder": {
    required: ["Medical terminology", "Anatomy", "ICD-10", "CPT", "HIPAA", "EHR workflows"],
    programs: ["medical-coding"],
    glossary: [],
  },
};

function normalise(s: string) {
  return s.trim().toLowerCase();
}

export function SkillGapAnalyzer() {
  const [current, setCurrent] = React.useState("");
  const [role, setRole] = React.useState<string>("AI Engineer");
  const [showing, setShowing] = React.useState(false);

  const target = ROLES[role]!;
  const currentSet = React.useMemo(
    () => new Set(current.split(/[,\n]/).map(normalise).filter(Boolean)),
    [current],
  );
  const missing = target.required.filter((r) => !currentSet.has(normalise(r)));
  const already = target.required.filter((r) => currentSet.has(normalise(r)));

  return (
    <ToolShell tool={TOOL} aiPrompt="Suggest a 4-week plan to close the top three missing skills.">
      <ToolCard title="Your skills and target role">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="skills">Current skills (comma or new-line separated)</FieldLabel>
            <Textarea
              id="skills"
              rows={6}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Python, JavaScript, SQL, Git…"
              className="mt-2"
            />
          </div>
          <div>
            <FieldLabel>Target role</FieldLabel>
            <div className="mt-2 grid gap-2">
              {Object.keys(ROLES).map((r) => (
                <label key={r} className={"flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm " + (role === r ? "border-primary bg-primary/5" : "border-border")}>
                  <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
                  {r}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Button onClick={() => setShowing(true)}>Analyze gap</Button>
        </div>
      </ToolCard>

      {showing ? (
        <div className="mt-6 space-y-6">
          <ToolCard title="Skills you already have">
            {already.length ? (
              <div className="flex flex-wrap gap-2">
                {already.map((s) => <span key={s} className="rounded-full bg-[color:oklch(0.92_0.14_150_/_0.35)] px-3 py-1 text-sm">{s}</span>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">Add your skills above to see matches.</p>}
          </ToolCard>

          <ToolCard title="Missing skills to build" footer={<Disclaimer>This tool orients your learning. It does not promise hiring or salary outcomes.</Disclaimer>}>
            {missing.length ? (
              <ol className="mt-2 grid gap-3">
                {missing.map((m, i) => (
                  <li key={m} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <div>
                      <div className="font-semibold">{m}</div>
                      <div className="text-xs text-muted-foreground">Recommended learning sequence step</div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">Great — you already cover the core skills for this role.</p>}
          </ToolCard>

          <ToolCard title="Recommended programs">
            <div className="flex flex-wrap gap-2">
              {target.programs.map((p) => (
                <span key={p} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{p.replace(/-/g, " ")}</span>
              ))}
            </div>
            {target.glossary.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="text-muted-foreground">Glossary:</span>
                {target.glossary.map((g) => (
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
