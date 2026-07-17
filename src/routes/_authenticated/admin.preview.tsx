import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePreview } from "@/lib/preview/preview-context";
import {
  searchPreviewUsers,
  startUserPreview,
  type PreviewUser,
} from "@/lib/admin/preview-users.functions";

export const Route = createFileRoute("/_authenticated/admin/preview")({
  component: PreviewAsUserPage,
});

const ROLE_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All roles" },
  { key: "student", label: "Students" },
  { key: "partner", label: "Sales Partners" },
  { key: "wl_owner", label: "Brand Owners" },
  { key: "instructor", label: "Instructors" },
  { key: "admin", label: "Admins" },
];

function ROLE_BADGE(role: string | null) {
  switch (role) {
    case "super_admin":
    case "admin":
    case "partner_manager":
      return "bg-primary/15 text-primary border-primary/30";
    case "partner":
      return "bg-cyan-500/15 text-cyan-500 border-cyan-500/30";
    case "wl_owner":
      return "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30";
    case "instructor":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "student":
      return "bg-lime-500/15 text-lime-600 border-lime-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function PreviewAsUserPage() {
  const search = useServerFn(searchPreviewUsers);
  const start = useServerFn(startUserPreview);
  const navigate = useNavigate();
  const { startPreview, preview } = usePreview();

  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("");
  const [users, setUsers] = useState<PreviewUser[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (input: { q: string; role: string }) =>
      search({ data: { q: input.q || undefined, role: input.role || undefined, limit: 30 } }),
    onSuccess: (res) => setUsers(res.users),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Search failed"),
  });

  // Initial load
  useEffect(() => {
    searchMutation.mutate({ q: "", role: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart(u: PreviewUser) {
    if (!u.primaryRole) {
      toast.error("This user has no role assigned — nothing to preview.");
      return;
    }
    setLaunchingId(u.userId);
    try {
      const p = await start({ data: { userId: u.userId } });
      startPreview({
        userId: p.userId,
        name: p.name,
        email: p.email,
        primaryRole: p.primaryRole,
        roleLabel: p.roleLabel,
        dashboardPath: p.dashboardPath,
        readOnly: true,
      });
      toast.success(`Previewing as ${p.name} (${p.roleLabel})`);
      navigate({ to: p.dashboardPath as any });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start preview");
    } finally {
      setLaunchingId(null);
    }
  }

  const helpText = useMemo(
    () =>
      "Search any user, pick a role, then launch Preview Mode to see the platform exactly as they do. Preview is read-only by default — you can toggle Edit mode from the banner if you need to intervene on their behalf.",
    [],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Eye className="h-3 w-3" /> Admin · Preview Mode
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
            Preview as user
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{helpText}</p>
        </div>
        {preview && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
            <div className="font-semibold text-amber-700 dark:text-amber-300">
              Active preview
            </div>
            <div className="text-muted-foreground">
              {preview.name} · {preview.roleLabel}
            </div>
          </div>
        )}
      </div>

      <form
        data-preview-allow
        onSubmit={(e) => {
          e.preventDefault();
          searchMutation.mutate({ q, role });
        }}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone or user ID…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.key || "all"}
              type="button"
              onClick={() => {
                setRole(r.key);
                searchMutation.mutate({ q, role: r.key });
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                role === r.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button type="submit" size="sm" disabled={searchMutation.isPending}>
          {searchMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        {searchMutation.isPending && users.length === 0 ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No users match your search.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li
                key={u.userId}
                className="flex flex-col items-start gap-3 p-3 sm:flex-row sm:items-center"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {u.name}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        ROLE_BADGE(u.primaryRole),
                      )}
                    >
                      {u.roleLabel}
                    </span>
                    {u.roles.length > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{u.roles.length - 1} more
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {u.email ?? "No email"}
                    {u.phone ? ` · ${u.phone}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleStart(u)}
                    disabled={launchingId === u.userId || !u.primaryRole}
                  >
                    {launchingId === u.userId ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
          <p>
            Preview is <strong>read-only by default</strong>. Form submissions are
            blocked until you switch to Edit mode from the banner.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-3.5 w-3.5 text-primary" />
          <p>
            Every preview session is logged in{" "}
            <code className="font-mono text-[10px]">admin_activity_log</code> for
            audit and compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
