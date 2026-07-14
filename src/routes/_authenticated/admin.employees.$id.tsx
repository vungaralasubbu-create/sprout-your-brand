import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getEmployeeById,
  saveSalaryStructure,
  reviewPfPreference,
  setEmployeeBenefit,
} from "@/lib/admin/employment.functions";

export const Route = createFileRoute("/_authenticated/admin/employees/$id")({
  component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
  const { id } = Route.useParams();
  const fetch = useServerFn(getEmployeeById);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-employee", id],
    queryFn: () => fetch({ data: { id } }),
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }
  const { employee, partner, structure, pfPreference, benefits, benefitTypes } = data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/employees">
          <ArrowLeft className="size-4" /> Back to Employees
        </Link>
      </Button>
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {employee.employee_code}
          </div>
          <h1 className="font-display text-2xl font-semibold">{partner?.display_name ?? "—"}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{partner?.partner_code}</span>
            <span>·</span>
            <span>{partner?.mobile ?? "—"}</span>
            <span>·</span>
            <span>{partner?.email ?? "—"}</span>
          </div>
        </div>
        <Badge variant={employee.employment_status === "active" ? "success" : "warning"}>
          {employee.employment_status}
        </Badge>
      </header>

      <Tabs defaultValue="structure">
        <TabsList>
          <TabsTrigger value="structure">Salary Structure</TabsTrigger>
          <TabsTrigger value="pf">PF Preference</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4">
          <SalaryStructureForm employeeId={employee.id} structure={structure} />
        </TabsContent>
        <TabsContent value="pf" className="mt-4">
          <PfReview employeeId={employee.id} pfPreference={pfPreference} />
        </TabsContent>
        <TabsContent value="benefits" className="mt-4">
          <BenefitsPanel employeeId={employee.id} benefits={benefits} benefitTypes={benefitTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------- Salary Structure ------------------------------ */

function SalaryStructureForm({ employeeId, structure }: { employeeId: string; structure: any }) {
  const qc = useQueryClient();
  const save = useServerFn(saveSalaryStructure);
  const [form, setForm] = useState(() => ({
    basic: Number(structure?.basic ?? 0),
    hra: Number(structure?.hra ?? 0),
    special_allowance: Number(structure?.special_allowance ?? 0),
    performance_incentive: Number(structure?.performance_incentive ?? 0),
    other_earnings: Number(structure?.other_earnings ?? 0),
    pf_applicable: Boolean(structure?.pf_applicable ?? false),
    employee_pf_amount: Number(structure?.employee_pf_amount ?? 0),
    employer_pf_amount: Number(structure?.employer_pf_amount ?? 0),
    professional_tax: Number(structure?.professional_tax ?? 0),
    tds: Number(structure?.tds ?? 0),
    other_deductions: Number(structure?.other_deductions ?? 0),
  }));
  const [saving, setSaving] = useState(false);

  const gross =
    form.basic + form.hra + form.special_allowance + form.performance_incentive + form.other_earnings;
  const empPf = form.pf_applicable ? form.employee_pf_amount : 0;
  const totalDed = empPf + form.professional_tax + form.tds + form.other_deductions;
  const net = gross - totalDed;

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: {
          employee_id: employeeId,
          monthly_gross: gross,
          ...form,
        },
      });
      toast.success("Salary structure saved");
      qc.invalidateQueries({ queryKey: ["admin-employee", employeeId] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  const num = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) || 0 }));

  return (
    <Card className="p-5 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-sm mb-2">Earnings</h3>
          <div className="space-y-2">
            <Field label="Basic" value={form.basic} onChange={num("basic")} />
            <Field label="HRA" value={form.hra} onChange={num("hra")} />
            <Field
              label="Special Allowance"
              value={form.special_allowance}
              onChange={num("special_allowance")}
            />
            <Field
              label="Performance Incentive"
              value={form.performance_incentive}
              onChange={num("performance_incentive")}
            />
            <Field
              label="Other Earnings"
              value={form.other_earnings}
              onChange={num("other_earnings")}
            />
          </div>
        </div>
        <div>
          <h3 className="font-medium text-sm mb-2">Deductions</h3>
          <div className="flex items-center gap-2 mb-2">
            <Switch
              checked={form.pf_applicable}
              onCheckedChange={(v) => setForm((f) => ({ ...f, pf_applicable: v }))}
            />
            <span className="text-sm">PF Applicable</span>
          </div>
          <div className="space-y-2">
            <Field
              label="Employee PF"
              value={form.employee_pf_amount}
              onChange={num("employee_pf_amount")}
              disabled={!form.pf_applicable}
            />
            <Field
              label="Employer PF (info only)"
              value={form.employer_pf_amount}
              onChange={num("employer_pf_amount")}
              disabled={!form.pf_applicable}
            />
            <Field
              label="Professional Tax"
              value={form.professional_tax}
              onChange={num("professional_tax")}
            />
            <Field label="TDS" value={form.tds} onChange={num("tds")} />
            <Field
              label="Other Deductions"
              value={form.other_deductions}
              onChange={num("other_deductions")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t">
        <Stat label="Monthly Gross" value={gross} />
        <Stat label="Total Deductions" value={totalDed} />
        <Stat label="Net Pay (approx)" value={net} highlight />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Salary Structure
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-56 text-sm text-slate-700">{label}</Label>
      <Input type="number" min={0} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={"rounded-md border p-3 " + (highlight ? "bg-cyan-50 border-cyan-300" : "")}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">
        ₹{Number(value).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

/* ------------------------- PF Review ------------------------------------ */

function PfReview({ employeeId, pfPreference }: { employeeId: string; pfPreference: any }) {
  const qc = useQueryClient();
  const submit = useServerFn(reviewPfPreference);
  const [status, setStatus] = useState<string>(pfPreference?.status ?? "under_review");
  const [notes, setNotes] = useState(pfPreference?.admin_notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(pfPreference?.status ?? "under_review");
    setNotes(pfPreference?.admin_notes ?? "");
  }, [pfPreference?.id]);

  async function save() {
    setSaving(true);
    try {
      await submit({
        data: { employee_id: employeeId, status: status as any, admin_notes: notes || undefined },
      });
      toast.success("PF preference reviewed");
      qc.invalidateQueries({ queryKey: ["admin-employee", employeeId] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 space-y-4">
      {!pfPreference ? (
        <p className="text-sm text-muted-foreground">
          Employee has not yet submitted a PF preference.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Employee Preference</div>
              <div className="font-medium">{pfPreference.preference}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Submitted At</div>
              <div className="font-medium">
                {pfPreference.updated_at
                  ? new Date(pfPreference.updated_at).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Admin Notes (visible to employee)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Review
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/* ----------------------------- Benefits --------------------------------- */

function BenefitsPanel({
  employeeId,
  benefits,
  benefitTypes,
}: {
  employeeId: string;
  benefits: any[];
  benefitTypes: any[];
}) {
  const qc = useQueryClient();
  const set = useServerFn(setEmployeeBenefit);
  const map = new Map(benefits.map((b) => [b.benefit_type_id, b]));

  async function toggle(bt: any, status: string) {
    try {
      await set({
        data: { employee_id: employeeId, benefit_type_id: bt.id, status: status as any },
      });
      toast.success("Benefit updated");
      qc.invalidateQueries({ queryKey: ["admin-employee", employeeId] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <Card className="p-5 space-y-4">
      {benefitTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No benefit types configured. Add benefit types in platform settings.
        </p>
      ) : (
        <div className="space-y-2">
          {benefitTypes.map((bt: any) => {
            const b = map.get(bt.id);
            const status = b?.status ?? "available";
            return (
              <div
                key={bt.id}
                className="flex items-center justify-between gap-3 border rounded-md p-3"
              >
                <div>
                  <div className="font-medium text-sm">{bt.label}</div>
                  {bt.description && (
                    <div className="text-xs text-muted-foreground">{bt.description}</div>
                  )}
                </div>
                <Select value={status} onValueChange={(v) => toggle(bt, v)}>
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="not_eligible">Not Eligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
