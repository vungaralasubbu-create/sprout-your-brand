import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { getTool } from "@/data/tools";
import { Button } from "@/components/ui/button";

const TOOL = getTool("ai-career-finder")!;

type Answers = {
  background: string;
  interest: string;
  experience: string;
  goal: string;
  industry: string;
  tech: string;
};

const QUESTIONS: Array<{ key: keyof Answers; q: string; options: { value: string; label: string }[] }> = [
  { key: "background", q: "What best describes your background?", options: [
    { value: "student", label: "Student / recent graduate" },
    { value: "working", label: "Working professional" },
    { value: "sales", label: "Sales / business development" },
    { value: "founder", label: "Founder / entrepreneur" },
    { value: "career_switch", label: "Career switcher" },
  ]},
  { key: "interest", q: "Which area interests you the most right now?", options: [
    { value: "ai", label: "Artificial Intelligence" },
    { value: "web", label: "Web / Software Development" },
    { value: "hardware", label: "VLSI / Embedded / IoT" },
    { value: "marketing", label: "Digital Marketing" },
    { value: "finance", label: "Finance / Investment Banking" },
    { value: "healthcare", label: "Medical Coding / Healthcare tech" },
  ]},
  { key: "experience", q: "How much hands-on experience do you have?", options: [
    { value: "none", label: "None yet — starting fresh" },
    { value: "basics", label: "Basics — I've explored a bit" },
    { value: "some", label: "Some — 1–2 real projects" },
    { value: "solid", label: "Solid — I've shipped work in this area" },
  ]},
  { key: "goal", q: "What's your learning goal?", options: [
    { value: "career", label: "Build a full career track" },
    { value: "sidegig", label: "Earn on the side with Glintr partner models" },
    { value: "founder", label: "Launch my own brand / white-label" },
    { value: "upskill", label: "Upskill in one specific area" },
  ]},
  { key: "industry", q: "Preferred industry?", options: [
    { value: "tech", label: "Technology / SaaS" },
    { value: "edu", label: "EdTech / training" },
    { value: "finance", label: "Finance / banking" },
    { value: "healthcare", label: "Healthcare" },
    { value: "any", label: "Open to any industry" },
  ]},
  { key: "tech", q: "Preferred technology angle?", options: [
    { value: "genai", label: "Generative AI / prompt tools" },
    { value: "ml", label: "Machine Learning / Data" },
    { value: "webapp", label: "Web / App development" },
    { value: "chips", label: "Chip design / firmware" },
    { value: "growth", label: "Growth / marketing tools" },
    { value: "none", label: "No preference yet" },
  ]},
];

function recommend(a: Answers) {
  const programs: string[] = [];
  const paths: string[] = [];
  const glossary: string[] = [];
  const blogs: string[] = [];
  const skills = new Set<string>();

  if (a.interest === "ai" || a.tech === "genai") {
    programs.push("artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai");
    paths.push("artificial-intelligence");
    glossary.push("artificial-intelligence", "prompt-engineering", "generative-ai");
    skills.add("Prompt engineering"); skills.add("LLM workflows"); skills.add("Python basics");
  }
  if (a.interest === "web" || a.tech === "webapp") {
    programs.push("web-development", "react", "javascript", "python");
    paths.push("software-development");
    glossary.push("html", "css", "javascript", "react");
    skills.add("HTML/CSS"); skills.add("JavaScript"); skills.add("React");
  }
  if (a.interest === "hardware" || a.tech === "chips") {
    programs.push("vlsi", "embedded-systems", "iot");
    glossary.push("vlsi", "embedded-systems", "iot");
    skills.add("Digital design"); skills.add("C for embedded"); skills.add("HDL basics");
  }
  if (a.interest === "marketing" || a.tech === "growth") {
    programs.push("digital-marketing", "seo", "social-media-marketing");
    glossary.push("seo", "social-media-marketing");
    skills.add("SEO fundamentals"); skills.add("Content strategy"); skills.add("Ad platforms");
  }
  if (a.interest === "finance") {
    programs.push("financial-modelling", "investment-banking");
    glossary.push("financial-modelling");
    skills.add("Financial modelling"); skills.add("Excel"); skills.add("Valuation");
  }
  if (a.interest === "healthcare") {
    programs.push("medical-coding");
    skills.add("Medical terminology"); skills.add("ICD-10 fundamentals");
  }
  if (a.goal === "sidegig") {
    blogs.push("become-a-sales-partner-with-glintr");
  }
  if (a.goal === "founder") {
    blogs.push("launch-your-own-edtech-brand");
  }

  return {
    programs: Array.from(new Set(programs)).slice(0, 5),
    paths: Array.from(new Set(paths)).slice(0, 3),
    glossary: Array.from(new Set(glossary)).slice(0, 5),
    blogs: Array.from(new Set(blogs)).slice(0, 3),
    skills: Array.from(skills).slice(0, 8),
  };
}

export function AiCareerFinder() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Partial<Answers>>({});
  const [done, setDone] = React.useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = Math.round(((step + (done ? 1 : 0)) / total) * 100);

  function pick(value: string) {
    if (!current) return;
    const next = { ...answers, [current.key]: value } as Partial<Answers>;
    setAnswers(next);
    if (step + 1 >= total) setDone(true);
    else setStep(step + 1);
  }

  function reset() {
    setStep(0); setAnswers({}); setDone(false);
  }

  const result = done ? recommend(answers as Answers) : null;

  return (
    <ToolShell tool={TOOL} aiPrompt="Explain why this program was recommended based on my answers.">
      {!done ? (
        <ToolCard title={`Question ${step + 1} of ${total}`}>
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div className="h-full bg-gradient-to-r from-[#00E6FF] to-[#7CFF6B]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-lg font-semibold">{current!.q}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {current!.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => pick(opt.value)}
                className="rounded-xl border border-border bg-background p-4 text-left text-sm transition hover:border-primary hover:bg-primary/5"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-caption text-muted-foreground">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="disabled:opacity-40">← Back</button>
            <span>{progress}%</span>
          </div>
        </ToolCard>
      ) : (
        <ToolCard
          title="Your personalised career recommendation"
          footer={<Disclaimer>No salary predictions. This is a learning-orientation guide based on your inputs, not a hiring outcome.</Disclaimer>}
        >
          {result!.programs.length ? (
            <>
              <div>
                <div className="text-caption font-semibold uppercase text-muted-foreground">Recommended programs</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result!.programs.map((p) => (
                    <Link key={p} to={"/programs" as string} className="rounded-full border border-border bg-background px-3 py-1 text-sm hover:border-primary">
                      {p.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <div className="text-caption font-semibold uppercase text-muted-foreground">Estimated learning order</div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  <li>Foundations — {result!.skills.slice(0, 2).join(", ") || "core concepts"}</li>
                  <li>Applied — {result!.skills.slice(2, 4).join(", ") || "hands-on projects"}</li>
                  <li>Specialisation — {result!.skills.slice(4).join(", ") || "advanced topics"}</li>
                </ol>
              </div>
              <div className="mt-5">
                <div className="text-caption font-semibold uppercase text-muted-foreground">Related skills</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
                  {result!.skills.map((s) => <span key={s} className="rounded-full bg-background px-2 py-0.5 text-xs">{s}</span>)}
                </div>
              </div>
              {result!.paths.length ? (
                <div className="mt-5">
                  <div className="text-caption font-semibold uppercase text-muted-foreground">Learning paths</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result!.paths.map((p) => (
                      <Link key={p} to={"/learning-paths/$slug" as string} params={{ slug: p }} className="text-sm text-primary hover:underline">
                        {p.replace(/-/g, " ")} →
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Try picking a specific interest area to see recommendations.</p>
          )}
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={reset}>Retake quiz</Button>
            <Button asChild><Link to="/find-your-program">Try Find Your Program →</Link></Button>
          </div>
        </ToolCard>
      )}
    </ToolShell>
  );
}
