import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Search, X } from "lucide-react";
import {
  adminListProgramSales,
  adminGetProgramSales,
  adminUpsertProgramSales,
} from "@/lib/admin/program-sales-content.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/program-sales-content")({
  component: AdminProgramSalesContent,
});

function AdminProgramSalesContent() {
  const listFn = useServerFn(adminListProgramSales);
  const { data: list, isLoading } = useQuery({
    queryKey: ["admin-program-sales-list"],
    queryFn: () => listFn(),
  });
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      (list ?? []).filter((c) =>
        q ? c.name.toLowerCase().includes(q.toLowerCase()) : true,
      ),
    [list, q],
  );

  const active = (list ?? []).find((c) => c.id === selected) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Program Sales Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage optional sales content shown to partners in the Programs Library.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-xs text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">No programs.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left p-3 rounded-md hover:bg-muted transition-colors ${
                  selected === c.id ? "bg-primary/10" : ""
                }`}
              >
                <div className="text-sm font-medium">{c.name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.category_name ? (
                    <Badge variant="muted" className="text-[10px]">
                      {c.category_name}
                    </Badge>
                  ) : null}
                  {c.has_content ? (
                    <span className="text-[10px] text-primary font-mono">
                      {c.talking_points_count}TP · {c.ideal_learners_count}IL ·{" "}
                      {c.faqs_count}Q · {c.objections_count}O
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Empty</span>
                  )}
                </div>
              </button>
            ))
          )}
        </Card>
      </div>

      <div>
        {active ? (
          <Editor courseId={active.id} courseName={active.name} />
        ) : (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Select a program to edit its sales content.
          </Card>
        )}
      </div>
    </div>
  );
}

function Editor({ courseId, courseName }: { courseId: string; courseName: string }) {
  const getFn = useServerFn(adminGetProgramSales);
  const saveFn = useServerFn(adminUpsertProgramSales);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-program-sales", courseId],
    queryFn: () => getFn({ data: { courseId } }),
  });

  const [tps, setTps] = useState<string[]>([]);
  const [ils, setIls] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [objs, setObjs] = useState<Array<{ objection: string; response: string }>>([]);

  useEffect(() => {
    if (!data) return;
    setTps(data.talking_points.length ? data.talking_points : [""]);
    setIls(data.ideal_learners.length ? data.ideal_learners : [""]);
    setFaqs(data.faqs.length ? data.faqs : [{ question: "", answer: "" }]);
    setObjs(data.objections.length ? data.objections : [{ objection: "", response: "" }]);
  }, [data, courseId]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          courseId,
          talking_points: tps,
          ideal_learners: ils,
          faqs,
          objections: objs,
        },
      }),
    onSuccess: () => {
      toast.success("Sales content saved");
      qc.invalidateQueries({ queryKey: ["admin-program-sales-list"] });
      qc.invalidateQueries({ queryKey: ["admin-program-sales", courseId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{courseName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Internal sales content — visible only to sales partners and admins.
          </p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="size-4" /> {save.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Talking Points */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Sales Talking Points</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTps((v) => [...v, ""])}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {tps.map((t, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={t}
              onChange={(e) =>
                setTps((v) => v.map((x, ix) => (ix === i ? e.target.value : x)))
              }
              placeholder="Practical learning focus, industry-inspired projects, etc."
              className="min-h-[60px]"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTps((v) => v.filter((_, ix) => ix !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </Card>

      {/* Ideal Learners */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Ideal Learner Profiles</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIls((v) => [...v, ""])}
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ils.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-1 border rounded-full pl-3 pr-1 py-0.5"
            >
              <input
                value={l}
                onChange={(e) =>
                  setIls((v) => v.map((x, ix) => (ix === i ? e.target.value : x)))
                }
                placeholder="Students, Graduates..."
                className="text-sm bg-transparent outline-none min-w-[120px]"
              />
              <button
                onClick={() => setIls((v) => v.filter((_, ix) => ix !== i))}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQs */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Common Questions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFaqs((v) => [...v, { question: "", answer: "" }])
            }
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {faqs.map((f, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2 relative">
            <Input
              value={f.question}
              onChange={(e) =>
                setFaqs((v) =>
                  v.map((x, ix) => (ix === i ? { ...x, question: e.target.value } : x)),
                )
              }
              placeholder="Question"
            />
            <Textarea
              value={f.answer}
              onChange={(e) =>
                setFaqs((v) =>
                  v.map((x, ix) => (ix === i ? { ...x, answer: e.target.value } : x)),
                )
              }
              placeholder="Suggested answer"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setFaqs((v) => v.filter((_, ix) => ix !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </Card>

      {/* Objections */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Common Objections</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setObjs((v) => [...v, { objection: "", response: "" }])
            }
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        {objs.map((o, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2 relative">
            <Input
              value={o.objection}
              onChange={(e) =>
                setObjs((v) =>
                  v.map((x, ix) => (ix === i ? { ...x, objection: e.target.value } : x)),
                )
              }
              placeholder="Objection (e.g. I don't have time)"
            />
            <Textarea
              value={o.response}
              onChange={(e) =>
                setObjs((v) =>
                  v.map((x, ix) => (ix === i ? { ...x, response: e.target.value } : x)),
                )
              }
              placeholder="Professional suggested response"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setObjs((v) => v.filter((_, ix) => ix !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
