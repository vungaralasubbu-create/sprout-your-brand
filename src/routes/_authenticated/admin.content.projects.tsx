import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Hands-on capstones and mini-projects surfaced across programs and Learn Guides.
        </p>
      </header>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 text-primary p-3">
            <FolderKanban className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-display text-base font-semibold">Managed inside each program</div>
            <p className="text-sm text-muted-foreground mt-1">
              Project briefs, deliverables and rubrics live on the course they belong to. Open a program to add
              or edit its capstones — cross-program discovery pages read from that same source.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to={"/admin/programs" as any}><Plus className="size-4 mr-1.5" /> Open Programs</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/admin/content/articles" search={{ type: "learn_guide", status: "", q: "project", category: "" }}>
                  Project-style Learn Guides
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
