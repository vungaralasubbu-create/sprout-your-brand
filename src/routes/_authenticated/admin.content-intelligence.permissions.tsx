import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Check, Minus } from "lucide-react";
import { INTEL_ROLES, CAPABILITY_MATRIX, type IntelCapability } from "@/lib/content-intelligence/authority";

export const Route = createFileRoute("/_authenticated/admin/content-intelligence/permissions")({
  component: PermissionsPage,
});

const CAPS: Array<{ key: IntelCapability; label: string }> = [
  { key: "view_dashboard", label: "View dashboard" },
  { key: "view_reports", label: "View reports" },
  { key: "assign_tasks", label: "Assign editor tasks" },
  { key: "resolve_tasks", label: "Resolve tasks" },
  { key: "edit_content", label: "Edit content" },
  { key: "approve_content", label: "Approve content" },
  { key: "manage_integrations", label: "Manage integrations" },
  { key: "manage_roles", label: "Manage roles" },
];

function PermissionsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Role matrix for the Content Intelligence platform. Roles are read from the platform's RBAC layer and mapped to Intelligence capabilities.
        </p>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Capability</th>
                {INTEL_ROLES.map((r) => (
                  <th key={r.role} className="text-center px-3 py-3 font-medium">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPS.map((cap) => (
                <tr key={cap.key} className="border-t border-border/60">
                  <td className="px-4 py-2.5 font-medium">{cap.label}</td>
                  {INTEL_ROLES.map((r) => {
                    const allowed = CAPABILITY_MATRIX[r.role][cap.key];
                    return (
                      <td key={r.role} className="text-center px-3 py-2.5">
                        {allowed
                          ? <Check className="size-4 text-emerald-600 inline" />
                          : <Minus className="size-4 text-muted-foreground/40 inline" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {INTEL_ROLES.map((r) => (
          <Card key={r.role} className="p-4">
            <div className="font-semibold text-sm">{r.label}</div>
            <div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground mb-2">{r.role}</div>
            <p className="text-xs text-muted-foreground">{r.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
