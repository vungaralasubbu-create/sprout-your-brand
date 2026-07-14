import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/partner/coming-soon")({
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <div className="max-w-2xl mx-auto p-8 lg:p-16">
      <div className="rounded-2xl bg-white border p-10 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto">
          <Clock className="size-6" />
        </span>
        <h1 className="mt-5 text-heading-lg font-display font-semibold tracking-tight">
          Coming Soon
        </h1>
        <p className="mt-2 text-muted-foreground">
          This section of your Sales Workspace is being built. We'll notify you
          once it goes live.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link to="/partner/dashboard">
              <ArrowLeft className="size-4" />
              Back to Overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
