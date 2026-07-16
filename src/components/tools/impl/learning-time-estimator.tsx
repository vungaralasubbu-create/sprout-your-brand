import * as React from "react";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { getTool } from "@/data/tools";

const TOOL = getTool("learning-time-estimator")!;

const PROGRAMS: Record<string, { label: string; totalHours: number; milestones: string[] }> = {
  "artificial-intelligence": { label: "Artificial Intelligence", totalHours: 180, milestones: ["Complete AI foundations", "Ship first ML notebook", "Deploy an LLM-powered mini app", "Capstone project"] },
  "chatgpt": { label: "ChatGPT Mastery", totalHours: 60, milestones: ["Prompt patterns basics", "Custom GPT / automation", "Domain use-case build"] },
  "web-development": { label: "Full-Stack Web Development", totalHours: 220, milestones: ["Static site", "Interactive React app", "Full-stack CRUD", "Deploy + monitor"] },
  "vlsi": { label: "VLSI", totalHours: 160, milestones: ["Verilog basics", "Small RTL blocks", "Verification project", "STA overview"] },
  "embedded-systems": { label: "Embedded Systems", totalHours: 140, milestones: ["MCU basics", "Peripheral drivers", "RTOS project"] },
  "iot": { label: "IoT", totalHours: 120, milestones: ["Sensor node", "Cloud connect", "OTA + fleet"] },
  "digital-marketing": { label: "Digital Marketing", totalHours: 110, milestones: ["SEO basics", "Paid ads sprint", "Full-funnel report"] },
  "financial-modelling": { label: "Financial Modelling", totalHours: 130, milestones: ["3-statement model", "Valuation model", "Sector case"] },
  "medical-coding": { label: "Medical Coding", totalHours: 150, milestones: ["Terminology", "Coding practice", "Mock exam"] },
};

export function LearningTimeEstimator() {
  const keys = Object.keys(PROGRAMS);
  const [program, setProgram] = React.useState<string>(keys[0]!);
  const [hoursPerWeek, setHoursPerWeek] = React.useState(6);

  const p = PROGRAMS[program]!;
  const weeks = Math.max(1, Math.ceil(p.totalHours / Math.max(1, hoursPerWeek)));
  const perMilestoneWeeks = Math.max(1, Math.round(weeks / p.milestones.length));

  return (
    <ToolShell tool={TOOL} aiPrompt="Suggest ways to shave 20% off this timeline without sacrificing depth.">
      <ToolCard title="Inputs">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>Program</FieldLabel>
            <select className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" value={program} onChange={(e) => setProgram(e.target.value)}>
              {keys.map((k) => <option key={k} value={k}>{PROGRAMS[k]!.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="hpw">Hours per week</FieldLabel>
            <Input id="hpw" type="number" min={2} max={40} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Math.max(2, Math.min(40, Number(e.target.value) || 0)))} className="mt-2" />
          </div>
        </div>
      </ToolCard>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Stat label="Estimated timeline" value={`${weeks} weeks`} />
        <Stat label="Study effort" value={`${p.totalHours} h total`} />
        <Stat label="Weekly cadence" value={`${hoursPerWeek} h / week`} />
      </div>

      <ToolCard title="Milestone schedule" footer={<Disclaimer>Estimates assume steady weekly effort. Real timelines vary with prior background and project depth.</Disclaimer>}>
        <ol className="grid gap-3">
          {p.milestones.map((m, i) => (
            <li key={m} className="rounded-xl border border-border bg-background p-4">
              <div className="text-caption text-muted-foreground">Milestone {i + 1} · around week {Math.min(weeks, (i + 1) * perMilestoneWeeks)}</div>
              <div className="mt-1 font-semibold">{m}</div>
            </li>
          ))}
        </ol>
      </ToolCard>
    </ToolShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}
