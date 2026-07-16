import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AutomationHeader } from "@/components/automation/header";
import { TEMPLATES } from "@/lib/automation/templates";
import { createWorkflowFromTemplate } from "@/lib/automation/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/workflows/templates")({
  component: TemplateLibrary,
});

function TemplateLibrary() {
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <AutomationHeader
        title="Workflow Library"
        description="Prebuilt automations for onboarding, revenue share, follow-ups, certificates, content and white-label launches."
        actions={<Button asChild variant="outline" size="sm"><Link to="/admin/workflows">Back to Workflows</Link></Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-lg border border-border/60 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">{t.nodes.length} blocks</span>
            </div>
            <h3 className="mt-2 text-base font-semibold">{t.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{t.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Trigger: {t.trigger.replace("trg.", "")}</span>
              <Button size="sm" onClick={() => { const wf = createWorkflowFromTemplate(t.id); nav({ to: "/admin/workflows/$id", params: { id: wf.id } }); }}>
                <Plus className="size-3.5 mr-1" /> Use <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
