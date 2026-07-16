import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  generateCourseSection,
  generateCourseAll,
  getCourseAiHistory,
} from "@/lib/admin/course-cms.functions";

type GenKind =
  | "overview"
  | "curriculum"
  | "learning_outcomes"
  | "skills"
  | "projects"
  | "career_data"
  | "tools"
  | "faqs"
  | "seo"
  | "blog_suggestions";

const SECTIONS: Array<{ kind: GenKind; label: string; description: string }> = [
  { kind: "overview", label: "Overview", description: "Hero title, description, highlights, who should join" },
  { kind: "curriculum", label: "Curriculum", description: "Modules and lessons with duration" },
  { kind: "learning_outcomes", label: "Learning Outcomes", description: "What learners will achieve" },
  { kind: "skills", label: "Skills", description: "Skills gained during the program" },
  { kind: "projects", label: "Projects", description: "Portfolio projects and deliverables" },
  { kind: "career_data", label: "Career Data", description: "Roles, salaries, roadmap, hiring partners" },
  { kind: "tools", label: "Tools", description: "Software and platforms taught" },
  { kind: "faqs", label: "FAQs", description: "10 category-unique frequently asked questions" },
  { kind: "seo", label: "SEO", description: "Meta title, description, keywords" },
  { kind: "blog_suggestions", label: "Blog Ideas", description: "6 related article suggestions" },
];

export const Route = createFileRoute("/_authenticated/admin/courses/$id/ai-studio")({
  component: AiStudioPanel,
});

function AiStudioPanel() {
  const { id } = useParams({ from: "/_authenticated/admin/courses/$id/ai-studio" });
  const qc = useQueryClient();
  const runSection = useServerFn(generateCourseSection);
  const runAll = useServerFn(generateCourseAll);
  const fetchHistory = useServerFn(getCourseAiHistory);

  const { data: history } = useQuery({
    queryKey: ["course-ai-history", id],
    queryFn: () => fetchHistory({ data: { courseId: id } }),
  });

  const sectionMutation = useMutation({
    mutationFn: (kind: GenKind) => runSection({ data: { courseId: id, kind } }),
    onSuccess: (_, kind) => {
      toast.success(`${kind} generated`);
      qc.invalidateQueries({ queryKey: ["course-ai-history", id] });
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allMutation = useMutation({
    mutationFn: () => runAll({ data: { courseId: id } }),
    onSuccess: (result) => {
      const ok = result.results.filter((r) => r.status === "fulfilled").length;
      const fail = result.results.length - ok;
      toast.success(`Generated ${ok} sections${fail ? ` · ${fail} failed` : ""}`);
      qc.invalidateQueries({ queryKey: ["course-ai-history", id] });
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              to="/admin/courses/$id"
              params={{ id }}
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to course
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">AI Studio</h1>
            <p className="mt-1 text-muted-foreground">
              Generate course content with AI. Each section is idempotent and audited.
            </p>
          </div>
          <Button
            onClick={() => allMutation.mutate()}
            disabled={allMutation.isPending}
            size="lg"
            className="gap-2"
          >
            {allMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate All
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => {
            const isPending =
              sectionMutation.isPending && sectionMutation.variables === section.kind;
            const lastRun = history?.rows.find((r) => r.kind === section.kind);
            return (
              <Card key={section.kind}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{section.label}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                    {lastRun && (
                      <Badge variant={lastRun.status === "success" ? "default" : "destructive"}>
                        {lastRun.status === "success" ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {lastRun.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sectionMutation.mutate(section.kind)}
                    disabled={isPending}
                    className="w-full gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate
                  </Button>
                  {lastRun && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last run: {new Date(lastRun.created_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {history && history.rows.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Generation history</CardTitle>
              <CardDescription>Last 50 AI runs on this course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {history.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{row.kind}</Badge>
                      <span className="text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant={row.status === "success" ? "default" : "destructive"}>
                      {row.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
