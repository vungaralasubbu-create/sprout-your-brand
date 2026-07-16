import * as React from "react";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTool } from "@/data/tools";

const TOOL = getTool("study-planner")!;

const GOALS = ["AI & Prompt Engineering", "Web Development", "VLSI Foundations", "Embedded & IoT", "Digital Marketing", "Financial Modelling", "Medical Coding"];

interface PlanWeek {
  focus: string;
  activities: string[];
  milestone?: string;
}

function generatePlan(goal: string, hoursPerWeek: number, weeks: number): PlanWeek[] {
  const buckets = [
    { focus: "Foundations", activities: ["Read core concepts", "Watch intro videos", "Take short quiz"] },
    { focus: "Guided practice", activities: ["Complete tutorials", "Solve exercises", "Notes recap"] },
    { focus: "Applied practice", activities: ["Mini project", "Peer review notes", "Blog a summary"] },
    { focus: "Deepen", activities: ["Second project", "Read a case study", "Refactor previous work"] },
    { focus: "Consolidate", activities: ["Revision block", "Q&A with mentor / AI", "Practice test"] },
    { focus: "Capstone", activities: ["Larger project scope", "Public writeup", "Portfolio update"] },
  ];
  const plan: PlanWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    const bucket = buckets[Math.min(i, buckets.length - 1)]!;
    plan.push({
      focus: `${bucket.focus} — ${goal}`,
      activities: [
        `${bucket.activities[0]} (${Math.round(hoursPerWeek * 0.4)}h)`,
        `${bucket.activities[1]} (${Math.round(hoursPerWeek * 0.4)}h)`,
        `${bucket.activities[2]} (${Math.max(1, Math.round(hoursPerWeek * 0.2))}h)`,
      ],
      milestone: i === Math.floor(weeks / 2) - 1 ? "Mid-plan review — self-assess and adjust" : i === weeks - 1 ? "Capstone deliverable" : undefined,
    });
  }
  return plan;
}

export function StudyPlanner() {
  const [goal, setGoal] = React.useState(GOALS[0]);
  const [hours, setHours] = React.useState(6);
  const [weeks, setWeeks] = React.useState(8);
  const [ready, setReady] = React.useState(false);

  const plan = ready ? generatePlan(goal, hours, weeks) : [];

  return (
    <ToolShell tool={TOOL} aiPrompt="Suggest a lighter version of this plan for someone with 3 hours per week.">
      <ToolCard title="Plan inputs">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <FieldLabel>Learning goal</FieldLabel>
            <select className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="hours">Hours per week</FieldLabel>
            <Input id="hours" type="number" min={2} max={40} value={hours} onChange={(e) => setHours(Math.max(2, Math.min(40, Number(e.target.value) || 0)))} className="mt-2" />
          </div>
          <div>
            <FieldLabel htmlFor="weeks">Timeline (weeks)</FieldLabel>
            <Input id="weeks" type="number" min={2} max={26} value={weeks} onChange={(e) => setWeeks(Math.max(2, Math.min(26, Number(e.target.value) || 0)))} className="mt-2" />
          </div>
        </div>
        <div className="mt-5"><Button onClick={() => setReady(true)}>Generate plan</Button></div>
      </ToolCard>

      {ready ? (
        <ToolCard
          title={`${weeks}-week plan · ${hours}h/week · ${goal}`}
          footer={<Disclaimer>Adjust weekly hours to your reality. Consistency beats intensity for skill building.</Disclaimer>}
        >
          <ol className="grid gap-3">
            {plan.map((w, i) => (
              <li key={i} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-caption text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Week {i + 1}</span>
                  <span>{w.focus}</span>
                </div>
                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
                  {w.activities.map((a) => <li key={a}>• {a}</li>)}
                </ul>
                {w.milestone ? <p className="mt-2 text-xs font-semibold text-primary">🎯 {w.milestone}</p> : null}
              </li>
            ))}
          </ol>
        </ToolCard>
      ) : null}
    </ToolShell>
  );
}
