import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content/case-studies")({
  component: CaseStudiesPage,
});

function CaseStudiesPage() {
  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Case Studies</h1>
        <p className="text-sm text-muted-foreground">
          Learner and partner success stories — outcomes, quotes and revenue narratives.
        </p>
      </header>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 text-primary p-3">
            <Trophy className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-display text-base font-semibold">Editorial layer</div>
            <p className="text-sm text-muted-foreground mt-1">
              Case studies are edited long-form — use the Blog CMS for the polished write-up and the
              Success Stories dataset for the metrics block that renders on <code className="text-xs">/success-stories</code>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to={"/admin/blogs" as any}>Open Blog CMS <ArrowRight className="size-4 ml-1.5" /></Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to={"/success-stories" as any} target="_blank">View live page</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
