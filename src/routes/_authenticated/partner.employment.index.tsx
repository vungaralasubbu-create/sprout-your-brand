import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarDays,
  ShieldCheck,
  Gift,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getEmployeeWorkspace,
  listMyAttendance,
  listMySalarySlips,
  submitPfPreference,
} from "@/lib/partner/employment.functions";

export const Route = createFileRoute("/_authenticated/partner/employment/")({
  loader: async ({ context }) => {
    // best-effort: if not FT employee, redirect to dashboard
    return null;
  },
  component: EmploymentPage,
});

const STATUS_META: Record<string, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  late: { label: "Late", className: "bg-amber-100 text-amber-900 border-amber-200" },
  half_day: { label: "Half Day", className: "bg-orange-100 text-orange-900 border-orange-200" },
  absent: { label: "Absent", className: "bg-red-100 text-red-800 border-red-200" },
  leave: { label: "Leave", className: "bg-sky-100 text-sky-900 border-sky-200" },
  weekly_off: { label: "Weekly Off", className: "bg-slate-100 text-slate-700 border-slate-200" },
  holiday: { label: "Holiday", className: "bg-violet-100 text-violet-900 border-violet-200" },
};

function EmploymentPage() {
  const fetch = useServerFn(getEmployeeWorkspace);
  const { data, isLoading } = useQuery({
    queryKey: ["employee-workspace"],
    queryFn: () => fetch(),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading employment…
      </div>
    );
  }
  if (!data || !data.employee) {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-2xl">
        <Card className="p-8 text-center space-y-3">
          <Briefcase className="size-10 mx-auto text-slate-400" />
          <h1 className="font-display text-xl font-semibold">
            Employment is only available for approved Full-Time Sales Professionals
          </h1>
          <p className="text-sm text-muted-foreground">
            You are currently on the Flexible Sales Partner model. To apply for Full-Time,
            visit your Account and choose Full-Time Sales Professional.
          </p>
          <Button asChild>
            <Link to="/partner/account">Open Account</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const {
    employee,
    partner,
    settings,
    todayAttendance,
    salaryStructure,
    pfPreference,
    benefits,
    latestPayroll,
  } = data;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Employment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Glintr full-time employment workspace.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Employee ID</div>
          <div className="font-mono text-sm font-semibold tabular-nums">
            {employee.employee_code}
          </div>
        </div>
      </header>

      {/* Employment top strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaCard label="Employee ID" value={employee.employee_code} />
        <MetaCard label="Joining Date" value={fmtDate(employee.joining_date)} />
        <MetaCard label="Work Model" value="Full-Time Sales Professional" />
        <MetaCard label="Salary Cycle" value="Monthly" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaCard
          label="Employment Status"
          value={cap(employee.employment_status)}
          highlight={employee.employment_status === "active" ? "good" : "warn"}
        />
        <MetaCard
          label="Today's Attendance"
          value={todayAttendance ? STATUS_META[todayAttendance.status]?.label ?? todayAttendance.status : "—"}
        />
        <MetaCard
          label="Salary Slip"
          value={
            latestPayroll
              ? `${monthName(latestPayroll.payroll_month)} ${latestPayroll.payroll_year}`
              : "Not yet generated"
          }
        />
        <MetaCard
          label="Benefits Active"
          value={String((benefits ?? []).filter((b: any) => b.status === "active").length)}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="benefits">Benefits & PF</TabsTrigger>
          <TabsTrigger value="salary">Salary Slips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewCard
            employee={employee}
            partner={partner}
            settings={settings}
            latestPayroll={latestPayroll}
            todayAttendance={todayAttendance}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <AttendanceCard settings={settings} employeeId={employee.id} />
        </TabsContent>

        <TabsContent value="benefits" className="mt-4 space-y-4">
          <PfBenefitsCard pfPreference={pfPreference} benefits={benefits ?? []} />
        </TabsContent>

        <TabsContent value="salary" className="mt-4 space-y-4">
          <SalarySlipsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- Overview ---------------------------------- */

function OverviewCard({
  employee,
  partner,
  settings,
  latestPayroll,
  todayAttendance,
}: {
  employee: any;
  partner: any;
  settings: any;
  latestPayroll: any;
  todayAttendance: any;
}) {
  return (
    <Card className="p-5 space-y-4">
      <SectionHead icon={Briefcase} title="Employment Summary" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Employee Name" value={partner?.display_name ?? "—"} />
        <InfoRow label="Employee ID" value={employee.employee_code} mono />
        <InfoRow label="Joining Date" value={fmtDate(employee.joining_date)} />
        <InfoRow label="Work Model" value="Full-Time Sales Professional" />
        <InfoRow label="Salary Cycle" value={cap(employee.salary_cycle)} />
        <InfoRow
          label="Employment Status"
          value={<Badge variant={employee.employment_status === "active" ? "success" : "warning"}>{cap(employee.employment_status)}</Badge>}
        />
        <InfoRow
          label="Today's First Login"
          value={todayAttendance?.first_login_at ? fmtTime(todayAttendance.first_login_at) : "—"}
        />
        <InfoRow
          label="Today's Last Activity"
          value={todayAttendance?.last_activity_at ? fmtTime(todayAttendance.last_activity_at) : "—"}
        />
        <InfoRow
          label="Working Hours (Configured)"
          value={settings ? `${settings.work_start_time} · ${settings.min_hours_full_day}h` : "—"}
        />
        <InfoRow
          label="Latest Salary Slip"
          value={
            latestPayroll
              ? `${monthName(latestPayroll.payroll_month)} ${latestPayroll.payroll_year} · ${latestPayroll.status === "paid" ? "Paid" : "Generated"}`
              : "Awaiting first payroll run"
          }
        />
      </div>
    </Card>
  );
}

/* ----------------------------- Attendance -------------------------------- */

function AttendanceCard({ settings, employeeId }: { settings: any; employeeId: string }) {
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const fetchAtt = useServerFn(listMyAttendance);
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", ym.year, ym.month, employeeId],
    queryFn: () => fetchAtt({ data: ym }),
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHead icon={CalendarDays} title="Attendance History" />
        <MonthPicker value={ym} onChange={setYm} />
      </div>

      {settings?.is_active === false && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-center gap-2">
          <AlertCircle className="size-4" />
          Attendance tracking is currently disabled by admin.
        </div>
      )}

      {/* Summary */}
      {data ? (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {(["present", "late", "half_day", "absent", "leave", "weekly_off", "holiday"] as const).map(
            (k) => (
              <div key={k} className="rounded-md border p-2 text-center">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {STATUS_META[k].label}
                </div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums">
                  {data.summary?.[k] ?? 0}
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (data?.records ?? []).length === 0 ? (
        <div className="text-sm text-muted-foreground">No attendance records for this month.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Date</th>
                <th>First Login</th>
                <th>Last Activity</th>
                <th>Working Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.records.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{fmtDate(r.attendance_date)}</td>
                  <td>{r.first_login_at ? fmtTime(r.first_login_at) : "—"}</td>
                  <td>{r.last_activity_at ? fmtTime(r.last_activity_at) : "—"}</td>
                  <td>{r.working_minutes ? `${Math.floor(r.working_minutes / 60)}h ${r.working_minutes % 60}m` : "—"}</td>
                  <td>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        STATUS_META[r.status]?.className ?? "",
                      )}
                    >
                      {STATUS_META[r.status]?.label ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Attendance is derived from your workspace login activity. You cannot edit attendance
        records; only admin can override entries.
      </p>
    </Card>
  );
}

function MonthPicker({
  value,
  onChange,
}: {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
}) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  return (
    <div className="flex items-center gap-2">
      <Select value={String(value.month)} onValueChange={(v) => onChange({ ...value, month: Number(v) })}>
        <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={String(m)}>{monthName(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(value.year)} onValueChange={(v) => onChange({ ...value, year: Number(v) })}>
        <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------- Benefits & PF -------------------------------- */

function PfBenefitsCard({ pfPreference, benefits }: { pfPreference: any; benefits: any[] }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitPfPreference);
  const [saving, setSaving] = useState<null | "interested" | "not_interested">(null);

  async function choose(p: "interested" | "not_interested") {
    setSaving(p);
    try {
      await submit({ data: { preference: p } });
      toast.success("PF preference submitted");
      qc.invalidateQueries({ queryKey: ["employee-workspace"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(null);
    }
  }

  const current = pfPreference?.preference;
  const locked = pfPreference && !["submitted", "under_review"].includes(pfPreference.status);

  return (
    <>
      <Card className="p-5 space-y-4">
        <SectionHead icon={ShieldCheck} title="Provident Fund Preference" />
        <p className="text-sm text-muted-foreground">
          Your selection is a preference request and may be subject to employment eligibility,
          applicable law and company approval. Selecting a preference does not automatically
          enrol you in PF.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChoiceCard
            title="Interested In PF Benefits"
            description="I would like to opt in to Provident Fund benefits, subject to approval."
            selected={current === "interested"}
            disabled={locked || saving !== null}
            loading={saving === "interested"}
            onClick={() => choose("interested")}
          />
          <ChoiceCard
            title="Continue Without PF Preference"
            description="I do not wish to opt in to Provident Fund benefits at this time."
            selected={current === "not_interested"}
            disabled={locked || saving !== null}
            loading={saving === "not_interested"}
            onClick={() => choose("not_interested")}
          />
        </div>
        {pfPreference ? (
          <div className="rounded-md border p-3 bg-slate-50 text-sm">
            <div className="font-medium">
              Status: <Badge variant="info">{cap(pfPreference.status)}</Badge>
            </div>
            {pfPreference.admin_notes && (
              <p className="mt-1 text-slate-700">Admin note: {pfPreference.admin_notes}</p>
            )}
          </div>
        ) : null}
      </Card>

      <Card className="p-5 space-y-4">
        <SectionHead icon={Gift} title="Employee Benefits" />
        {benefits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No benefits are enabled for your profile yet. Admin will add benefits as they become
            available.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{b.benefit_types?.label ?? "—"}</div>
                  <Badge
                    variant={
                      b.status === "active"
                        ? "success"
                        : b.status === "not_eligible"
                          ? "danger"
                          : "info"
                    }
                  >
                    {cap(b.status)}
                  </Badge>
                </div>
                {b.benefit_types?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.benefit_types.description}
                  </p>
                )}
                {b.admin_notes && (
                  <p className="mt-2 text-xs text-slate-600">{b.admin_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Sales employees cannot activate their own benefits. Admin controls all benefit
          eligibility.
        </p>
      </Card>
    </>
  );
}

function ChoiceCard({
  title,
  description,
  selected,
  disabled,
  loading,
  onClick,
}: {
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border p-4 transition-colors disabled:opacity-70",
        selected ? "border-cyan-400 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="font-medium">{title}</div>
        {selected && <CheckCircle2 className="size-4 text-cyan-600" />}
        {loading && <Loader2 className="size-4 animate-spin" />}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

/* ---------------------------- Salary Slips ------------------------------- */

function SalarySlipsCard() {
  const fetch = useServerFn(listMySalarySlips);
  const { data, isLoading } = useQuery({
    queryKey: ["my-salary-slips"],
    queryFn: () => fetch(),
  });

  return (
    <Card className="p-5 space-y-4">
      <SectionHead icon={FileText} title="Monthly Salary Slips" />
      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No salary slips generated yet. Salary slips will appear here once admin approves and
          generates your payroll.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Month</th>
                <th>Gross Earnings</th>
                <th>Total Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2">
                    {monthName(s.payroll_month)} {s.payroll_year}
                  </td>
                  <td>₹{Number(s.gross_earnings).toLocaleString("en-IN")}</td>
                  <td>₹{Number(s.total_deductions).toLocaleString("en-IN")}</td>
                  <td className="font-semibold">₹{Number(s.net_pay).toLocaleString("en-IN")}</td>
                  <td>
                    <Badge variant={s.status === "paid" ? "success" : "info"}>
                      {s.status === "paid" ? "Paid" : "Generated"}
                    </Badge>
                  </td>
                  <td>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/partner/employment/salary-slips/$id"
                        params={{ id: s.id }}
                      >
                        View Salary Slip
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Salary slips are generated only from admin-approved payroll records. Values are
        read-only.
      </p>
    </Card>
  );
}

/* ------------------------------- helpers --------------------------------- */

function SectionHead({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-cyan-50 text-cyan-700 p-2">
        <Icon className="size-4" />
      </div>
      <h2 className="font-display text-base font-semibold">{title}</h2>
    </div>
  );
}
function MetaCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 bg-white",
        highlight === "good" && "border-emerald-200 bg-emerald-50",
        highlight === "warn" && "border-amber-200 bg-amber-50",
      )}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm font-medium", mono && "font-mono")}>{value}</div>
    </div>
  );
}
function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(v: string) {
  return new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "long" });
}
function cap(v: string) {
  return String(v ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
