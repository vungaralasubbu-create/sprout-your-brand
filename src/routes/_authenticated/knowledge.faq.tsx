import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HelpCircle, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listFaqs, upsertFaq } from "@/lib/knowledge/knowledge.functions";

export const Route = createFileRoute("/_authenticated/knowledge/faq")({
  component: FaqPage,
});

function FaqPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", category: "" });
  const lf = useServerFn(listFaqs);
  const up = useServerFn(upsertFaq);
  const q = useQuery({ queryKey: ["kn-faqs"], queryFn: () => lf({}) });
  const mut = useMutation({
    mutationFn: () => up({ data: { ...form } }),
    onSuccess: () => { toast.success("FAQ saved"); setOpen(false); setForm({ question: "", answer: "", category: "" }); qc.invalidateQueries({ queryKey: ["kn-faqs"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const faqs = q.data?.faqs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Answers your AI agents will use for support, sales, and public FAQs.</div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add FAQ</Button>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No FAQs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((f: any) => (
            <details key={f.id} className="rounded-2xl border bg-card">
              <summary className="cursor-pointer list-none p-4 font-medium hover:bg-muted/30">
                {f.category && <span className="mr-2 rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{f.category}</span>}
                {f.question}
              </summary>
              <div className="border-t p-4 text-sm text-muted-foreground whitespace-pre-line">{f.answer}</div>
            </details>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl">
            <div className="border-b p-5 text-sm font-semibold">New FAQ</div>
            <div className="space-y-3 p-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Question</label>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Answer</label>
                <textarea rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!form.question.trim() || !form.answer.trim() || mut.isPending} onClick={() => mut.mutate()}>
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
