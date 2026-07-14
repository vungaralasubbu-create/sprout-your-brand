import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/access-restricted")({
  component: AccessRestricted,
});

function AccessRestricted() {
  return (
    <div className="max-w-xl mx-auto text-center py-24">
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2">Access Restricted</h1>
      <p className="text-muted-foreground mb-6">
        You do not have permission to access this Admin function. If you believe this is a mistake,
        contact a Super Admin.
      </p>
      <Button asChild>
        <Link to="/admin/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
