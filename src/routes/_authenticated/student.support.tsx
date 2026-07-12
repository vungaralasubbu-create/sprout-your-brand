import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/support")({ component: Page });

function Page() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <h1 className="text-3xl font-display font-semibold tracking-tight">Support</h1>
      <p className="mt-1 text-muted-foreground text-sm">We're here to help you finish what you started.</p>
      <div className="mt-6 grid gap-4">
        <Card className="p-6">
          <LifeBuoy className="size-6 text-primary mb-3" />
          <div className="font-display text-lg font-semibold">Course & Learning Help</div>
          <div className="text-sm text-muted-foreground mt-1">Questions about your program, curriculum, assessments, or certificates.</div>
          <Button className="mt-4" asChild>
            <a href="mailto:support@glintr.com"><Mail className="size-4" /> Email support@glintr.com</a>
          </Button>
        </Card>
        <Card className="p-6">
          <div className="font-display text-lg font-semibold">FAQs</div>
          <div className="text-sm text-muted-foreground mt-1">Common questions about enrollments, certificates, and payments.</div>
          <Button variant="outline" className="mt-4" asChild><Link to="/contact">Contact us</Link></Button>
        </Card>
      </div>
    </div>
  );
}
