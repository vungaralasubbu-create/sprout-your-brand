import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getAttendanceSettings,
  updateAttendanceSettings,
} from "@/lib/admin/employment.functions";

export const Route = createFileRoute("/_authenticated/admin/employment-settings")({
  component: SettingsPage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SettingsPage() {
  const qc = useQueryClient();
  const fetch = useServerFn(getAttendanceSettings);
  const save = useServerFn(updateAttendanceSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-settings"],
    queryFn: () => fetch(),
  });

  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !form) {
      setForm({
        is_active: data.is_active,
        work_start_time: data.work_start_time?.slice(0, 5) ?? "10:00",
        late_mark_time: data.late_mark_time?.slice(0, 5) ?? "10:30",
        min_hours_full_day: Number(data.min_hours_full_day ?? 8),
        min_hours_half_day: Number(data.min_hours_half_day ?? 4),
        working_days: data.working_days ?? [1, 2, 3, 4, 5, 6],
        weekly_off_days: data.weekly_off_days ?? [0],
      });
    }
  }, [data, form]);

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: form });
      toast.success("Attendance settings saved");
      qc.invalidateQueries({ queryKey: ["attendance-settings"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  function toggleDay(dow: number, key: "working_days" | "weekly_off_days") {
    setForm((f: any) => ({
      ...f,
      [key]: f[key].includes(dow)
        ? f[key].filter((d: number) => d !== dow)
        : [...f[key], dow].sort(),
    }));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Attendance Settings</h1>
        <p className="text-sm text-muted-foreground">
          Global rules for how login activity translates to attendance status.
        </p>
      </header>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="font-medium">Attendance Tracking</div>
            <div className="text-xs text-muted-foreground">
              When disabled, no new attendance is recorded from login activity.
            </div>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_active: v }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Work Start Time</Label>
            <Input
              type="time"
              value={form.work_start_time}
              onChange={(e) => setForm((f: any) => ({ ...f, work_start_time: e.target.value }))}
            />
          </div>
          <div>
            <Label>Late Mark Time</Label>
            <Input
              type="time"
              value={form.late_mark_time}
              onChange={(e) => setForm((f: any) => ({ ...f, late_mark_time: e.target.value }))}
            />
          </div>
          <div>
            <Label>Min hours for Full Day</Label>
            <Input
              type="number"
              min={0}
              max={24}
              step="0.5"
              value={form.min_hours_full_day}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, min_hours_full_day: Number(e.target.value) || 0 }))
              }
            />
          </div>
          <div>
            <Label>Min hours for Half Day</Label>
            <Input
              type="number"
              min={0}
              max={24}
              step="0.5"
              value={form.min_hours_half_day}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, min_hours_half_day: Number(e.target.value) || 0 }))
              }
            />
          </div>
        </div>

        <div>
          <Label>Working Days</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i, "working_days")}
                className={
                  "px-3 py-1.5 rounded-md text-sm border " +
                  (form.working_days.includes(i)
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "bg-white text-slate-700 border-slate-200")
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Weekly Off Days</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i, "weekly_off_days")}
                className={
                  "px-3 py-1.5 rounded-md text-sm border " +
                  (form.weekly_off_days.includes(i)
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 border-slate-200")
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
