import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, ShieldCheck, PencilLine, Eye, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/content/settings")({
  component: SettingsPage,
});

const ROLES = [
  { key: "content_writer", name: "Content Writer", icon: PencilLine, perms: ["Draft content", "Add editorial notes", "Submit for review"] },
  { key: "editor", name: "Editor", icon: PencilLine, perms: ["All Writer perms", "Approve drafts", "Restore revisions"] },
  { key: "seo_manager", name: "SEO Manager", icon: ShieldCheck, perms: ["Edit SEO panel", "Manage canonical / schema", "Run quality checks"] },
  { key: "reviewer", name: "Reviewer", icon: Eye, perms: ["Review-only access", "Add comments", "Mark comments resolved"] },
  { key: "administrator", name: "Administrator", icon: UserCog, perms: ["Full access", "Manage authors / categories / tags", "Publish, schedule, archive"] },
];

function SettingsPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Content Studio Settings</h1>
        <p className="text-sm text-muted-foreground">Roles and defaults for editorial workflow.</p>
      </header>

      <Card className="p-5 space-y-3">
        <h2 className="font-medium flex items-center gap-2"><Users className="size-4" /> Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.key} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Icon className="size-4" /> {r.name}
                </div>
                <div className="mt-1 space-y-0.5">
                  {r.perms.map((p) => <div key={p} className="text-xs text-muted-foreground">• {p}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 space-y-2">
        <h2 className="font-medium">Workflow defaults</h2>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>• All new content starts in <Badge variant="outline">Draft</Badge> status.</p>
          <p>• AI-generated drafts always require human review before publishing.</p>
          <p>• Every save creates a revision; the last 50 revisions are shown in the editor.</p>
          <p>• Scheduled items auto-publish via <code>promote_scheduled_content()</code> when their time passes.</p>
          <p>• Published items are visible via public routes; drafts and reviews stay admin-only via RLS.</p>
        </div>
      </Card>

      <Card className="p-5 space-y-2">
        <h2 className="font-medium">Mobile</h2>
        <p className="text-sm text-muted-foreground">Editors can review drafts, resolve comments, and update workflow status on mobile. Primary long-form editing remains optimised for desktop.</p>
      </Card>
    </div>
  );
}
