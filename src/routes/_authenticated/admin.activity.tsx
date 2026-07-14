import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminActivity } from "@/lib/admin/admin-team.functions";
import { useAdminSession, hasPermission } from "@/hooks/use-admin-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/permissions";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivityPage,
});

function AdminActivityPage() {
  const { data: session } = useAdminSession();
  const fn = useServerFn(listAdminActivity);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => fn({ data: { limit: 200 } }) as any,
    enabled: hasPermission(session, "admin_team.view"),
  });

  if (session && !hasPermission(session, "admin_team.view")) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>You do not have permission to view Admin Activity.</p>
        <Link to="/admin/dashboard" className="underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Admin</div>
        <h1 className="font-display text-2xl font-semibold mt-1">Admin Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chronological record of admin actions. Historical entries are preserved and cannot be edited.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left py-2.5 px-4">Date & Time</th>
                  <th className="text-left py-2.5 px-4">Admin</th>
                  <th className="text-left py-2.5 px-4">Role</th>
                  <th className="text-left py-2.5 px-4">Action</th>
                  <th className="text-left py-2.5 px-4">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>
                )}
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium">{r.actor_name}</div>
                      {r.actor_admin_code && (
                        <div className="text-xs text-muted-foreground font-mono">{r.actor_admin_code}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {r.actor_role ? (
                        <Badge variant="outline" className="text-xs">{ADMIN_ROLE_LABELS[r.actor_role] ?? r.actor_role}</Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium">{r.title ?? r.event_type}</div>
                      {r.summary && <div className="text-xs text-muted-foreground">{r.summary}</div>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">
                      {r.entity_type ? `${r.entity_type}${r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}` : ""}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
