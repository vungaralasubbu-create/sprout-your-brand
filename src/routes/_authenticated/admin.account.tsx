import { createFileRoute } from "@tanstack/react-router";
import { useAdminSession } from "@/hooks/use-admin-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERMISSION_GROUPS, ADMIN_ROLE_LABELS, ACCOUNT_STATUS_LABELS } from "@/lib/admin/permissions";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/account")({
  component: AdminAccountPage,
});

function AdminAccountPage() {
  const { data: session, isLoading } = useAdminSession();
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const admin = session?.adminUser;
  const isSuper = session?.isSuperAdmin;
  const allPerms = session?.permissions ?? [];
  const has = (p: string) => allPerms.includes("*") || allPerms.includes(p) || isSuper;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Admin</div>
        <h1 className="font-display text-2xl font-semibold mt-1">My Account</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Row label="Name" value={admin?.full_name ?? "—"} />
            <Row label="Admin ID" value={admin?.admin_code ?? "—"} mono />
            <Row label="Email" value={admin?.email ?? "—"} />
            <Row label="Mobile" value={admin?.mobile ?? "—"} />
            <Row label="Role" value={
              <Badge variant="outline">
                {isSuper ? "Super Admin" : admin?.admin_role ? (ADMIN_ROLE_LABELS[admin.admin_role] ?? admin.admin_role) : "Legacy Admin"}
              </Badge>
            } />
            <Row label="Status" value={
              <Badge variant={admin?.account_status === "active" ? "default" : "danger"}>
                {admin?.account_status ? ACCOUNT_STATUS_LABELS[admin.account_status] : "Active"}
              </Badge>
            } />
            <Row label="Last Login" value={admin?.last_login_at ? format(new Date(admin.last_login_at), "dd MMM yyyy, HH:mm") : "—"} />
            <Row label="Created" value={admin?.created_at ? format(new Date(admin.created_at), "dd MMM yyyy") : "—"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Permissions</CardTitle>
          <p className="text-xs text-muted-foreground">
            {isSuper ? "Super Admin has full access to every Admin function." :
             "These are your effective permissions (role defaults + custom overrides). Only a Super Admin can change them."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.key} className="border border-border/70 rounded-lg p-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
                  {g.label}
                </div>
                <ul className="space-y-1.5">
                  {g.permissions.map((p) => (
                    <li key={p.key} className="flex items-center gap-2 text-sm">
                      {has(p.key) ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <X className="size-4 text-muted-foreground/50" />
                      )}
                      <span className={has(p.key) ? "" : "text-muted-foreground/70"}>{p.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
