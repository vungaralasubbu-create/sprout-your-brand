import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard, FieldLabel } from "@/components/tools/tool-shell";
import { getTool } from "@/data/tools";

const TOOL = getTool("learning-roadmap")!;

const DOMAINS: Record<string, { label: string; foundation: string[]; intermediate: string[]; advanced: string[]; projects: string[]; programs: string[]; paths: string[] }> = {
  ai: {
    label: "Artificial Intelligence",
    foundation: ["Python essentials", "Statistics & probability", "Data handling with pandas", "Intro to Machine Learning"],
    intermediate: ["Supervised & unsupervised ML", "Deep learning with PyTorch/TF", "NLP fundamentals", "Prompt engineering"],
    advanced: ["Transformer architectures", "RAG & vector databases", "Fine-tuning open models", "LLM evaluation & safety"],
    projects: ["Custom ChatGPT for a niche", "Document Q&A with RAG", "Sentiment classifier from scratch", "Image classification pipeline"],
    programs: ["artificial-intelligence", "chatgpt", "claude-ai", "gemini-ai"],
    paths: ["artificial-intelligence"],
  },
  web: {
    label: "Web Development",
    foundation: ["HTML & CSS", "JavaScript fundamentals", "Git & GitHub", "Responsive design"],
    intermediate: ["React or Vue", "REST APIs", "State management", "Basic Node.js"],
    advanced: ["TypeScript deeply", "SSR / Edge deployment", "Testing & CI/CD", "Performance & accessibility"],
    projects: ["Portfolio site", "Full-stack CRUD app", "Realtime chat", "Deploy to Cloudflare / Vercel"],
    programs: ["web-development", "react", "javascript", "python"],
    paths: ["software-development"],
  },
  vlsi: {
    label: "VLSI",
    foundation: ["Digital electronics", "Verilog / SystemVerilog basics", "Combinational & sequential logic"],
    intermediate: ["RTL design", "Verification methodology", "Synthesis basics", "STA fundamentals"],
    advanced: ["UVM verification", "Physical design flow", "Low-power design", "DFT & scan chains"],
    projects: ["4-bit ALU in Verilog", "UART controller", "RTL-to-GDS mini flow"],
    programs: ["vlsi"],
    paths: [],
  },
  embedded: {
    label: "Embedded Systems",
    foundation: ["C programming", "Microcontroller basics", "Digital electronics"],
    intermediate: ["ARM Cortex-M", "RTOS fundamentals", "Peripheral drivers", "Communication protocols"],
    advanced: ["FreeRTOS / Zephyr in depth", "Bootloader design", "Low-power firmware", "Debugging with JTAG"],
    projects: ["Sensor + Bluetooth beacon", "Home automation node", "Motor control firmware"],
    programs: ["embedded-systems"],
    paths: [],
  },
  iot: {
    label: "Internet of Things",
    foundation: ["Embedded C or MicroPython", "Sensors & actuators", "MQTT basics"],
    intermediate: ["Cloud dashboards", "Edge processing", "OTA updates", "Security fundamentals"],
    advanced: ["Fleet management", "Digital twins", "Industrial IoT protocols", "AI on edge"],
    projects: ["Smart weather station", "Fleet tracker", "Predictive maintenance MVP"],
    programs: ["iot"],
    paths: [],
  },
  marketing: {
    label: "Digital Marketing",
    foundation: ["Search intent & SEO basics", "Content strategy", "Google Analytics", "Ad platforms overview"],
    intermediate: ["On-page + technical SEO", "Paid social", "Email marketing", "Attribution & UTMs"],
    advanced: ["Full-funnel measurement", "Growth experimentation", "Brand strategy", "AI-assisted content ops"],
    projects: ["Publish an SEO-ranked article", "Run a paid social sprint", "Newsletter with 100 subs"],
    programs: ["digital-marketing", "seo", "social-media-marketing"],
    paths: [],
  },
  finance: {
    label: "Finance",
    foundation: ["Accounting basics", "Excel for finance", "Financial statements"],
    intermediate: ["Financial modelling", "Valuation (DCF, comps)", "Corporate finance", "Capital markets"],
    advanced: ["Investment banking workflows", "M&A modelling", "LBO", "Sector deep-dives"],
    projects: ["3-statement model", "DCF for a listed company", "Pitch a stock in 2 pages"],
    programs: ["financial-modelling", "investment-banking"],
    paths: [],
  },
  medical: {
    label: "Medical Coding",
    foundation: ["Medical terminology", "Human anatomy", "Basics of ICD-10 & CPT"],
    intermediate: ["Coding guidelines", "HIPAA & compliance", "EHR workflows"],
    advanced: ["Specialty coding", "Auditing", "Denial management"],
    projects: ["Practice code sets", "Mock chart audits", "Exam-style question bank"],
    programs: ["medical-coding"],
    paths: [],
  },
};

const OPTIONS = Object.entries(DOMAINS).map(([k, v]) => ({ value: k, label: v.label }));

export function LearningRoadmapTool() {
  const [choice, setChoice] = React.useState<string>("ai");
  const domain = DOMAINS[choice]!;

  return (
    <ToolShell tool={TOOL} aiPrompt={`Explain the ${domain.label} roadmap in plain language for a beginner.`}>
      <ToolCard title="Choose your domain">
        <FieldLabel>Domain</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setChoice(o.value)}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition " +
                (o.value === choice
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
              aria-pressed={o.value === choice}
            >
              {o.label}
            </button>
          ))}
        </div>
      </ToolCard>

      <div className="mt-6 space-y-6">
        <Stage title="Foundation" tone="from-[#00E6FF] to-[#2E5CFF]" items={domain.foundation} />
        <Stage title="Intermediate" tone="from-[#2E5CFF] to-[#7CFF6B]" items={domain.intermediate} />
        <Stage title="Advanced" tone="from-[#7CFF6B] to-[#00E6FF]" items={domain.advanced} />
        <Stage title="Projects to build" tone="from-[#00E6FF] to-[#7CFF6B]" items={domain.projects} />

        <ToolCard title="Related Glintr programs">
          <div className="flex flex-wrap gap-2">
            {domain.programs.map((p) => (
              <span key={p} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{p.replace(/-/g, " ")}</span>
            ))}
          </div>
          {domain.paths.length ? (
            <div className="mt-4 text-sm">
              See the full learning path: {domain.paths.map((p) => (
                <Link key={p} to="/learning-paths/$slug" params={{ slug: p }} className="text-primary hover:underline">/learning-paths/{p}</Link>
              ))}
            </div>
          ) : null}
        </ToolCard>
      </div>
    </ToolShell>
  );
}

function Stage({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className={"inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white " + tone}>{title}</div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((it) => <li key={it} className="rounded-lg bg-background p-3 text-sm">{it}</li>)}
      </ul>
    </div>
  );
}
