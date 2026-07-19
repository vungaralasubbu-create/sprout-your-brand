import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Send, Video } from "lucide-react";
import { submitReviewByToken } from "@/lib/admin/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/submit-review/$token")({
  component: SubmitReviewPage,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Invalid review link</div>,
  head: () => ({ meta: [{ title: "Share Your Story — Glintr" }, { name: "description", content: "Share your learning experience with Glintr." }] }),
});

function SubmitReviewPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const submit = useServerFn(submitReviewByToken);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [company, setCompany] = useState("");
  const [salBefore, setSalBefore] = useState("");
  const [salAfter, setSalAfter] = useState("");
  const [careerNotes, setCareerNotes] = useState("");
  const [roleBefore, setRoleBefore] = useState("");
  const [roleAfter, setRoleAfter] = useState("");

  const m = useMutation({
    mutationFn: () => submit({
      data: {
        token,
        rating,
        title: title || undefined,
        review_text: text,
        video_url: videoUrl || undefined,
        reviewer_linkedin_url: linkedin || undefined,
        company_name: company || undefined,
        salary_before_lpa: salBefore ? Number(salBefore) : undefined,
        salary_after_lpa: salAfter ? Number(salAfter) : undefined,
        before_snapshot: roleBefore ? { role: roleBefore } : undefined,
        after_snapshot: roleAfter ? { role: roleAfter } : undefined,
        career_growth_notes: careerNotes || undefined,
      },
    }),
    onSuccess: () => { toast.success("Thank you! Your review is being reviewed."); setTimeout(() => navigate({ to: "/" }), 1500); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Share your Glintr journey</h1>
          <p className="text-muted-foreground text-sm mt-1">Help future learners by sharing your honest experience.</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} type="button" aria-label={`${n} stars`}>
                <Star className={`w-8 h-8 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Title (optional)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best decision I made this year" maxLength={160} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Your story <span className="text-red-500">*</span></label>
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you learn? What changed for you? Be specific." maxLength={5000} />
          <div className="text-xs text-muted-foreground mt-1">{text.length}/5000 · minimum 30 characters</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Video className="w-3 h-3" /> Video testimonial URL</label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube / Loom / Vimeo" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">LinkedIn URL</label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="text-sm font-semibold">Career & salary growth (optional but powerful)</div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Role before" value={roleBefore} onChange={(e) => setRoleBefore(e.target.value)} />
            <Input placeholder="Role after" value={roleAfter} onChange={(e) => setRoleAfter(e.target.value)} />
            <Input placeholder="Company (after)" value={company} onChange={(e) => setCompany(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="₹ before (LPA)" value={salBefore} onChange={(e) => setSalBefore(e.target.value)} type="number" />
              <Input placeholder="₹ after (LPA)" value={salAfter} onChange={(e) => setSalAfter(e.target.value)} type="number" />
            </div>
          </div>
          <Textarea rows={2} placeholder="Anything else about your growth?" value={careerNotes} onChange={(e) => setCareerNotes(e.target.value)} maxLength={2000} />
        </div>

        <Button className="w-full" size="lg" disabled={m.isPending || text.trim().length < 30} onClick={() => m.mutate()}>
          <Send className="w-4 h-4 mr-2" /> Submit Review
        </Button>
      </Card>
    </div>
  );
}
