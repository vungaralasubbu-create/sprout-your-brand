import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listStudentAssessments, startAssessment, submitAssessment } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/assessments")({ component: Page });

function Page() {
  const listFn = useServerFn(listStudentAssessments);
  const startFn = useServerFn(startAssessment);
  const submitFn = useServerFn(submitAssessment);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["student-assessments"], queryFn: () => listFn() });

  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function start(assessmentId: string) {
    try {
      const s = await startFn({ data: { assessmentId } });
      setSession(s); setAnswers({}); setResult(null);
    } catch (e: any) { toast.error(e.message); }
  }
  async function submit() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await submitFn({ data: { attemptId: session.attempt.id, answers } });
      setResult(res);
      qc.invalidateQueries({ queryKey: ["student-assessments"] });
      qc.invalidateQueries({ queryKey: ["student-overview"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight">Assessments</h1>
        <p className="mt-1 text-muted-foreground text-sm">Take assessments to complete your program.</p>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      {!isLoading && data.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">No assessments yet.</Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((a: any) => (
          <Card key={a.id} className="p-5">
            <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{a.course?.name ?? "Course"}</div>
            <div className="mt-1 font-display text-lg font-semibold">{a.name}</div>
            {a.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="muted">Pass ≥ {Number(a.pass_percentage).toFixed(0)}%</Badge>
              {a.is_required && <Badge variant="outline">Required</Badge>}
              {a.bestAttempt && (
                <Badge variant={a.bestAttempt.passed ? "success" : "danger"}>
                  Best: {Number(a.bestAttempt.percentage ?? 0).toFixed(0)}%
                </Badge>
              )}
            </div>
            <Button className="mt-4" onClick={() => start(a.id)}>{a.bestAttempt ? "Retake" : "Start"}</Button>
          </Card>
        ))}
      </div>

      <Dialog open={!!session} onOpenChange={(o) => { if (!o) { setSession(null); setResult(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{session?.assessment?.name}</DialogTitle></DialogHeader>
          {result ? (
            <div className="text-center py-6">
              <div className={`text-4xl font-display font-semibold ${result.passed ? "text-emerald-600" : "text-rose-600"}`}>
                {result.percentage}%
              </div>
              <div className="mt-2 text-sm">{result.score} / {result.max} points</div>
              <Badge className="mt-3" variant={result.passed ? "success" : "danger"}>
                {result.passed ? "Passed" : "Not Passed"}
              </Badge>
            </div>
          ) : (
            <div className="space-y-5">
              {(session?.questions ?? []).map((q: any, i: number) => (
                <div key={q.id} className="space-y-2">
                  <div className="text-sm"><span className="font-mono text-xs text-muted-foreground mr-2">Q{i + 1}</span>{q.question_text}</div>
                  {q.question_type === "tf" ? (
                    <RadioGroup value={(answers[q.id] ?? [])[0] ?? ""} onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: [v] }))}>
                      {["true","false"].map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value={v} /> {v[0].toUpperCase() + v.slice(1)}
                        </label>
                      ))}
                    </RadioGroup>
                  ) : q.question_type === "mcq" ? (
                    <RadioGroup value={(answers[q.id] ?? [])[0] ?? ""} onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: [v] }))}>
                      {((q.options ?? []) as any[]).map((opt: any) => {
                        const val = typeof opt === "string" ? opt : opt.value ?? opt.id;
                        const label = typeof opt === "string" ? opt : opt.label ?? opt.text ?? val;
                        return <label key={val} className="flex items-center gap-2 text-sm"><RadioGroupItem value={val} /> {label}</label>;
                      })}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-1">
                      {((q.options ?? []) as any[]).map((opt: any) => {
                        const val = typeof opt === "string" ? opt : opt.value ?? opt.id;
                        const label = typeof opt === "string" ? opt : opt.label ?? opt.text ?? val;
                        const checked = (answers[q.id] ?? []).includes(val);
                        return (
                          <label key={val} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={checked} onCheckedChange={(c) => setAnswers((a) => {
                              const cur = a[q.id] ?? [];
                              return { ...a, [q.id]: c ? [...cur, val] : cur.filter((x) => x !== val) };
                            })} /> {label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {(session?.questions ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No questions configured for this assessment yet.</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setSession(null); setResult(null); }}>Close</Button>
            {!result && <Button onClick={submit} disabled={busy || (session?.questions ?? []).length === 0}>{busy ? "Scoring…" : "Submit Assessment"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
