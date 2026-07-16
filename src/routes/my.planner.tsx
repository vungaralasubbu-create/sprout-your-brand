import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { usePlanner, useProfile, type PlannerBlock } from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/planner")({
  component: PlannerPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am..21pm
const KIND_COLOR: Record<PlannerBlock["kind"], string> = {
  study: "from-primary/80 to-primary/60",
  read: "from-accent/80 to-accent/60",
  practice: "from-emerald-500/80 to-emerald-500/60",
  review: "from-amber-500/80 to-amber-500/60",
};

function PlannerPage() {
  const { blocks, upsert, remove } = usePlanner();
  const { profile } = useProfile();
  const [selected, setSelected] = useState<{ day: number; hour: number } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PlannerBlock>();
    blocks.forEach((b) => map.set(`${b.day}-${b.hour}`, b));
    return map;
  }, [blocks]);

  const suggestPlan = () => {
    const focus = profile.focus || "Study session";
    const template: Array<Omit<PlannerBlock, "id">> = [
      { day: 0, hour: 9, title: `${focus}: read`, kind: "read" },
      { day: 1, hour: 10, title: `${focus}: practice`, kind: "practice" },
      { day: 2, hour: 19, title: `${focus}: study`, kind: "study" },
      { day: 3, hour: 20, title: `${focus}: study`, kind: "study" },
      { day: 4, hour: 18, title: "Review week", kind: "review" },
      { day: 5, hour: 11, title: "Deep work: project", kind: "study" },
    ];
    template.forEach((t) => upsert(t));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Planner
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AI study planner
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Design your weekly study rhythm. Click any cell to add a block; use the suggestion to seed a full week.
          </p>
        </div>
        <button
          type="button"
          onClick={suggestPlan}
          className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
        >
          <Wand2 className="h-3.5 w-3.5" /> Suggest weekly plan
        </button>
      </header>

      <Panel>
        <div className="scrollbar-none overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-1">
              <div />
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="rounded-lg bg-muted/40 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
              {HOURS.map((h) => (
                <>
                  <div
                    key={`h-${h}`}
                    className="pr-2 text-right text-[10px] font-medium text-muted-foreground"
                  >
                    {h}:00
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const b = grouped.get(`${dayIdx}-${h}`);
                    return (
                      <button
                        key={`${dayIdx}-${h}`}
                        type="button"
                        onClick={() => setSelected({ day: dayIdx, hour: h })}
                        className={
                          "relative flex h-11 items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors " +
                          (b
                            ? `border-transparent bg-gradient-to-br ${KIND_COLOR[b.kind]} text-primary-foreground shadow-sm`
                            : "border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5")
                        }
                        aria-label={b ? `Edit ${b.title}` : `Add block on ${DAYS[dayIdx]} at ${h}:00`}
                      >
                        {b ? <span className="line-clamp-1 px-1">{b.title}</span> : <Plus className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {selected && (
        <BlockEditor
          slot={selected}
          existing={blocks.find((b) => b.day === selected.day && b.hour === selected.hour)}
          onSave={(b) => {
            upsert(b);
            setSelected(null);
          }}
          onDelete={(id) => {
            remove(id);
            setSelected(null);
          }}
          onCancel={() => setSelected(null)}
        />
      )}

      <Panel eyebrow="Legend" title="Session types">
        <ul className="flex flex-wrap gap-2 text-[11px]">
          {(["study", "read", "practice", "review"] as const).map((k) => (
            <li
              key={k}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1"
            >
              <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${KIND_COLOR[k]}`} />
              <span className="font-semibold capitalize text-foreground">{k}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function BlockEditor({
  slot,
  existing,
  onSave,
  onDelete,
  onCancel,
}: {
  slot: { day: number; hour: number };
  existing?: PlannerBlock;
  onSave: (b: Omit<PlannerBlock, "id"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [kind, setKind] = useState<PlannerBlock["kind"]>(existing?.kind ?? "study");
  return (
    <Panel
      eyebrow={`${DAYS[slot.day]} · ${slot.hour}:00`}
      title={existing ? "Edit block" : "New study block"}
    >
      <div className="grid gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Study Prompt Engineering"
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {(["study", "read", "practice", "review"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={
                "rounded-full border px-3 py-1 text-xs font-semibold capitalize " +
                (kind === k
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/60 bg-card text-muted-foreground")
              }
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!title.trim()}
            onClick={() =>
              onSave({
                id: existing?.id,
                day: slot.day,
                hour: slot.hour,
                title: title.trim(),
                kind,
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Save block
          </button>
          {existing && (
            <button
              type="button"
              onClick={() => onDelete(existing.id)}
              className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </Panel>
  );
}
