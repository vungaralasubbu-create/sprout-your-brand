import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminUser,
  setPermissionOverrides,
  updateAdminUser,
} from "@/lib/admin/admin-team.functions";
import { useAdminSession } from "@/hooks/use-admin-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSION_GROUPS, ADMIN_ROLES, ADMIN_ROLE_LABELS, ACCOUNT_STATUS_LABELS } from "@/lib/admin/permissions";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/team/$id")({
  component: AdminTeamDetail,
});

function AdminTeamDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useAdminSession();
  const canManage = !!session?.isSuperAdmin;
  const getFn = useServerFn(getAdminUser);
  const setFn = useServerFn(setPermissionOverrides);
  const updFn = useServerFn(updateAdminUser);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => getFn({ data: { userId: id } }) as any,
  });

  // effective set = role permissions +/- overrides
  const [effective, setEffective] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    if (!data) return;
    const base = new Set<string>(data.rolePermissions ?? []);
    for (const o of data.overrides ?? []) {
      if (o.allowed) base.add(o.permission_key);
      else base.delete(o.permission_key);
    }
    setEffective(base);
    setSelectedRole(data.adminUser.admin_role);
    setSelectedStatus(data.adminUser.account_status);
  }, [data]);

  const saveOverrides = useMutation({
    mutationFn: async () => {
      const roleBase = new Set<string>(data?.rolePermissions ?? []);
      const overrides: { permissionKey: string; allowed: boolean | null }[] = [];
      const allKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
      for (const k of allKeys) {
        const inRole = roleBase.has(k);
        const inEffective = effective.has(k);
        if (inRole === inEffective) {
          // no override needed, remove any existing
          overrides.push({ permissionKey: k, allowed: null });
        } else {
          overrides.push({ permissionKey: k, allowed: inEffective });
        }
      }
      return setFn({ data: { userId: id, overrides } });
    },
    onSuccess: () => {
      toast.success("Permissions saved");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-session"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const saveMeta = useMutation({
    mutationFn: async () => updFn({
      data: {
        userId: id,
        adminRole: selectedRole as any,
        accountStatus: selectedStatus as any,
      },
    }),
    onSuccess: () => {
      toast.success("Admin updated");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const admin = data.adminUser;
  const canEdit = canManage && admin.user_id !== session?.adminUser?.user_id;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/team"><ArrowLeft className="size-4 mr-1" />Back to Team</Link>
        </Button>
      </div>

      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {admin.admin_code}
        </div>
        <h1 className="font-display text-2xl font-semibold mt-1">{admin.full_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{admin.email}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Role & Status</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 items-end">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Admin Role</div>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Account Status</div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              onClick={() => saveMeta.mutate()}
              disabled={!canEdit || saveMeta.isPending}
            >
              <Save className="size-4 mr-2" />
              {saveMeta.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Permissions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Base role permissions are pre-selected. Tick or untick to grant or revoke individual permissions for this user
            without changing the role default for other admins.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.key} className="border border-border/70 rounded-lg p-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  {g.label}
                </div>
                <ul className="space-y-2">
                  {g.permissions.map((p) => (
                    <li key={p.key} className="flex items-center gap-2">
                      <Checkbox
                        id={p.key}
                        checked={effective.has(p.key)}
                        disabled={!canEdit || admin.admin_role === "super_admin"}
                        onCheckedChange={(v) => {
                          setEffective((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(p.key); else next.delete(p.key);
                            return next;
                          });
                        }}
                      />
                      <label htmlFor={p.key} className="text-sm cursor-pointer">{p.label}</label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {admin.admin_role === "super_admin" ? (
            <div className="text-xs text-muted-foreground">
              Super Admin has full access to every Admin function — permissions cannot be restricted.
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => saveOverrides.mutate()} disabled={!canEdit || saveOverrides.isPending}>
                <Save className="size-4 mr-2" />
                {saveOverrides.isPending ? "Saving…" : "Save Permissions"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
