import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMyPrimaryWorkspace,
  listMembers,
  inviteMember,
} from "@/lib/marketing-cloud/workspaces.functions";

export const Route = createFileRoute("/_authenticated/cloud/team")({
  component: Team,
});

function Team() {
  const getPrimary = useServerFn(getMyPrimaryWorkspace);
  const list = useServerFn(listMembers);
  const invite = useServerFn(inviteMember);
  const ws = useQuery({ queryKey: ["mc-primary"], queryFn: () => getPrimary({}) });
  const members = useQuery({
    queryKey: ["mc-members", ws.data?.workspace?.id],
    queryFn: () =>
      ws.data?.workspace ? list({ data: { workspace_id: ws.data.workspace.id } }) : { members: [] },
    enabled: !!ws.data?.workspace,
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!ws.data?.workspace) return;
    setSending(true);
    try {
      await invite({ data: { workspace_id: ws.data.workspace.id, email, role } });
      toast.success("Invite recorded");
      setEmail("");
      members.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Invite failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-24 sm:px-6 lg:px-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">Team</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Members & roles</h1>

      <div className="mt-8 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 font-medium">
          <UserPlus className="h-4 w-4 text-primary" />
          Invite a teammate
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-2 flex h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={send} disabled={!email || sending}>
              <Plus className="mr-2 h-4 w-4" /> Invite
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm font-medium">Current members</div>
        <div className="mt-3 divide-y rounded-2xl border bg-card">
          {(members.data?.members ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">You're the only member so far.</div>
          ) : (
            (members.data?.members ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">{m.invited_email || m.user_id}</div>
                  <div className="text-xs capitalize text-muted-foreground">{m.role}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
