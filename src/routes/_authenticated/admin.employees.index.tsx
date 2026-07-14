import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listEmployees, ensureEmployeeProfile } from "@/lib/admin/employment.functions";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const qc = useQueryClient();
  const fetch = useServerFn(listEmployees);
  const create = useServerFn(ensureEmployeeProfile);
  const { data, isLoading } = useQuery({ queryKey: ["admin-employees"], queryFn: () => fetch() });
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [partnerId, setPartnerId] = useState("");

  async function addEmployee() {
    if (!partnerId) return toast.error("Partner ID required");
    setCreating(true);
    try {
      const res = await create({ data: { partner_id: partnerId.trim() } });
      toast.success(res.created ? "Employee profile created" : "Profile already exists");
      setPartnerId("");
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  }

  const filtered = (data ?? []).filter((e: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      e.employee_code?.toLowerCase().includes(s) ||
      e.partner?.display_name?.toLowerCase().includes(s) ||
      e.partner?.partner_code?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Full-Time Sales Professionals with generated employee IDs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search employee…"
              className="pl-9 h-9 w-64"
            />
          </div>
        </div>
      </header>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">Convert Full-Time Partner to Employee</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="Partner ID (UUID)"
            className="w-96"
          />
          <Button onClick={addEmployee} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Generate Employee ID
          </Button>
          <p className="text-xs text-muted-foreground">
            Partner must have work_model = full_time and be approved.
          </p>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">No employees yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Employee ID</th>
                  <th>Partner</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Structure</th>
                  <th>PF</th>
                  <th>Benefits</th>
                  <th>Latest Payroll</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 font-mono">{e.employee_code}</td>
                    <td>
                      <div className="font-medium">{e.partner?.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {e.partner?.partner_code ?? "—"}
                      </div>
                    </td>
                    <td>
                      {e.joining_date
                        ? new Date(e.joining_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      <Badge variant={e.employment_status === "active" ? "success" : "warning"}>
                        {e.employment_status}
                      </Badge>
                    </td>
                    <td>
                      {e.structure ? (
                        <span className="tabular-nums">
                          ₹{Number(e.structure.monthly_gross).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <Badge variant="warning">Not set</Badge>
                      )}
                    </td>
                    <td>
                      {e.pf_preference ? (
                        <Badge variant="info">
                          {e.pf_preference.preference} · {e.pf_preference.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>{e.active_benefits_count}</td>
                    <td>
                      {e.latest_payroll ? (
                        <span className="text-xs">
                          {e.latest_payroll.payroll_month}/{e.latest_payroll.payroll_year} ·{" "}
                          {e.latest_payroll.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/employees/$id" params={{ id: e.id }}>
                          Manage
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
