import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminUsers, createAdminUser, updateAdminUser } from "@/lib/admin/admin-team.functions";
import { useAdminSession, hasPermission } from "@/hooks/use-admin-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, ACCOUNT_STATUS_LABELS } from "@/lib/admin/permissions";
import { UserPlus, Settings2, ShieldOff, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/team/")({
  component: AdminTeamPage,
});

function AdminTeamPage() {
  const { data: session } = useAdminSession();
  const canView = hasPermission(session, "admin_team.view");
  const canManage = !!session?.isSuperAdmin;
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminUsers);
  const updateFn = useServerFn(updateAdminUser);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn() as any,
    enabled: canView,
  });

  const suspend = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "active" | "suspended" }) =>
      updateFn({ data: { userId, accountStatus: status } }),
    onSuccess: () => {
      toast.success("Admin updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (session && !canView) {
    return <div className="p-8 text-center text-muted-foreground">Access restricted.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Admin</div>
          <h1 className="font-display text-2xl font-semibold mt-1">Admin Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin users, roles, and permissions. Only Super Admin can create or edit admin accounts.
          </p>
        </div>
        {canManage && <AddAdminDialog />}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin Users ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left py-2.5 px-4">Admin</th>
                  <th className="text-left py-2.5 px-4">Admin ID</th>
                  <th className="text-left py-2.5 px-4">Email</th>
                  <th className="text-left py-2.5 px-4">Role</th>
                  <th className="text-left py-2.5 px-4">Status</th>
                  <th className="text-left py-2.5 px-4">Last Login</th>
                  <th className="text-right py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</td></tr>}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No admin users yet.</td></tr>
                )}
                {rows.map((r: any) => (
                  <tr key={r.user_id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-4 font-medium">{r.full_name}</td>
                    <td className="py-2.5 px-4 font-mono text-xs">{r.admin_code}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{r.email}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline">{ADMIN_ROLE_LABELS[r.admin_role] ?? r.admin_role}</Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={r.account_status === "active" ? "default" : "destructive"}>
                        {ACCOUNT_STATUS_LABELS[r.account_status]}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">
                      {r.last_login_at ? format(new Date(r.last_login_at), "dd MMM yyyy, HH:mm") : "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex justify-end gap-2">
                        {canManage && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/admin/team/$id" params={{ id: r.user_id }}>
                              <Settings2 className="size-3.5 mr-1.5" />Permissions
                            </Link>
                          </Button>
                        )}
                        {canManage && r.admin_role !== "super_admin" && (
                          r.account_status === "active" ? (
                            <Button size="sm" variant="ghost"
                              onClick={() => suspend.mutate({ userId: r.user_id, status: "suspended" })}>
                              <ShieldOff className="size-3.5 mr-1.5 text-destructive" />Suspend
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost"
                              onClick={() => suspend.mutate({ userId: r.user_id, status: "active" })}>
                              <ShieldCheck className="size-3.5 mr-1.5 text-primary" />Reactivate
                            </Button>
                          )
                        )}
                      </div>
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

function AddAdminDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", mobile: "", adminRole: "sales_admin" });
  const createFn = useServerFn(createAdminUser);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async () => createFn({ data: form as any }),
    onSuccess: () => {
      toast.success("Admin user created");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setForm({ fullName: "", email: "", mobile: "", adminRole: "sales_admin" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create admin"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="size-4 mr-2" />Add Admin User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Admin User</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Mobile Number</Label>
            <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <Label>Admin Role</Label>
            <Select value={form.adminRole} onValueChange={(v) => setForm((f) => ({ ...f, adminRole: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.fullName || !form.email}
          >
            {create.isPending ? "Creating…" : "Create Admin User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
