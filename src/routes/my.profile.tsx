import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { useProfile, useWeeklyGoals, type WeeklyGoal } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/profile")({
  component: ProfilePage,
});

const INTEREST_OPTIONS = [
  "Artificial Intelligence",
  "Software Development",
  "VLSI & Electronics",
  "Digital Marketing",
  "Data & Analytics",
  "Cloud & DevOps",
  "Product & Design",
  "Business & Sales",
];

function ProfilePage() {
  const { profile, setProfile } = useProfile();
  const { goals, setGoals } = useWeeklyGoals();
  const [saved, setSaved] = useState(false);

  const toggleInterest = (i: string) =>
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(i)
        ? p.interests.filter((x) => x !== i)
        : [...p.interests, i],
    }));

  const addGoal = () =>
    setGoals((prev) => [
      ...prev,
      {
        id: `g_${Date.now()}`,
        label: "New goal",
        target: 1,
        metric: "custom",
        done: 0,
      } as WeeklyGoal,
    ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Profile
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Your workspace preferences
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Stored privately on your device. Nothing here leaves your browser unless you sign in.
        </p>
      </header>

      <Panel eyebrow="Identity" title="About you">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Display name
            </span>
            <input
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="e.g. Aditi"
              className="rounded-lg border border-border/60 bg-background px-3 py-2 outline-none focus:border-primary/50"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current focus
            </span>
            <input
              value={profile.focus}
              onChange={(e) => setProfile((p) => ({ ...p, focus: e.target.value }))}
              placeholder="e.g. AI product management"
              className="rounded-lg border border-border/60 bg-background px-3 py-2 outline-none focus:border-primary/50"
            />
          </label>
        </div>
      </Panel>

      <Panel eyebrow="Interests" title="Preferred categories">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((i) => {
            const active = profile.interests.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                  (active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground")
                }
              >
                {i}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        eyebrow="Weekly goals"
        title="Saved learning goals"
        action={
          <button
            type="button"
            onClick={addGoal}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" /> Add goal
          </button>
        }
      >
        <ul className="space-y-2">
          {goals.map((g, idx) => (
            <li key={g.id} className="grid gap-2 rounded-xl border border-border/50 bg-card/50 p-3 sm:grid-cols-[1fr_100px_100px_auto]">
              <input
                value={g.label}
                onChange={(e) =>
                  setGoals((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
                className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                aria-label="Goal label"
              />
              <input
                type="number"
                min={1}
                value={g.target}
                onChange={(e) =>
                  setGoals((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, target: Math.max(1, Number(e.target.value) || 1) } : x,
                    ),
                  )
                }
                className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                aria-label="Target"
              />
              <select
                value={g.metric}
                onChange={(e) =>
                  setGoals((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, metric: e.target.value as WeeklyGoal["metric"] } : x)),
                  )
                }
                className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs outline-none focus:border-primary/50"
                aria-label="Metric"
              >
                <option value="articles">Articles</option>
                <option value="modules">Modules</option>
                <option value="glossary">Glossary</option>
                <option value="roadmap-steps">Roadmap steps</option>
                <option value="custom">Custom</option>
              </select>
              <button
                type="button"
                onClick={() => setGoals((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${g.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel eyebrow="Notifications" title="Educational reminders only">
        <ul className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(profile.notifications) as Array<keyof typeof profile.notifications>).map((k) => (
            <li key={k}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-card/40 p-3">
                <input
                  type="checkbox"
                  checked={profile.notifications[k]}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      notifications: { ...p.notifications, [k]: e.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold capitalize text-foreground">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {NOTIF_HELP[k]}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Panel>

      <div>
        <button
          type="button"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background"
        >
          <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}

const NOTIF_HELP: Record<string, string> = {
  weeklySummary: "A digest of your learning at the end of each week.",
  studyReminder: "Gentle reminders during your planner blocks.",
  roadmapUpdates: "Alerts when a saved roadmap gains new content.",
  newArticles: "New blog posts in your preferred categories.",
};
