import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/knowledge/team")({
  component: TeamPage,
});

function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-sm font-semibold">Team knowledge</div>
        <p className="mt-1 text-xs text-muted-foreground">Departments, roles, responsibilities, approvals, and internal SOPs your AI agents should follow.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Bucket icon={Building2} title="Departments" />
          <Bucket icon={Users} title="Roles & responsibilities" />
          <Bucket icon={Users} title="Internal SOPs" />
        </div>
        <div className="mt-4">
          <Button asChild><Link to="/knowledge/upload">Add team document</Link></Button>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">Manage members</div>
        <p className="mt-1">Workspace members and roles are managed in the Cloud team page.</p>
        <Button asChild variant="outline" size="sm" className="mt-3"><Link to="/cloud/team">Open team settings</Link></Button>
      </div>
    </div>
  );
}

function Bucket({ icon: Icon, title }: any) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">Upload as a document and tag with the “team” category.</p>
    </div>
  );
}
