import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard, StatCard } from "@/components/brand-os/brand-shell";
import { loadState } from "@/lib/brand-os/storage";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/students")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/students", title: "Students — Glintr", description: "White Label OS", noindex: true }),
  component: Students,
});

const PER = 6;

function Students() {
  const [s, setS] = useState(loadState());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all");
  const [page, setPage] = useState(0);
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const filtered = useMemo(() => s.students.filter((st) =>
    (filter === "all" || st.status === filter) &&
    (st.name.toLowerCase().includes(q.toLowerCase()) || st.email.toLowerCase().includes(q.toLowerCase()) || st.program.toLowerCase().includes(q.toLowerCase()))
  ), [s.students, q, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER));
  const rows = filtered.slice(page * PER, page * PER + PER);

  const active = s.students.filter((x) => x.status === "active").length;
  const completed = s.students.filter((x) => x.status === "completed").length;
  const paused = s.students.filter((x) => x.status === "paused").length;

  return (
    <>
      <BrandPageHeader eyebrow="Academy" title="Students" description="Enrollments, progress, and completion status across your programs." />
      <BrandBody>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={s.students.length} />
          <StatCard label="Active" value={active} />
          <StatCard label="Completed" value={completed} />
          <StatCard label="Paused" value={paused} />
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-4 border-b">
            <div className="flex-1 flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name, email, program…" className="border-0 focus-visible:ring-0 shadow-none" />
            </div>
            <div className="inline-flex rounded-lg border bg-white p-0.5 text-xs">
              {(["all", "active", "completed", "paused"] as const).map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPage(0); }} className={`px-2.5 py-1 rounded-md capitalize ${filter === f ? "bg-primary text-white" : ""}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-slate-50/40">
                <tr>
                  <th className="text-left px-4 py-2.5">Student</th>
                  <th className="text-left px-4 py-2.5">Program</th>
                  <th className="text-left px-4 py-2.5">Progress</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((st) => (
                  <tr key={st.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{st.name}</div>
                      <div className="text-xs text-muted-foreground">{st.email}</div>
                    </td>
                    <td className="px-4 py-3">{st.program}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${st.progress}%` }} />
                        </div>
                        <span className="text-xs tabular-nums">{st.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] capitalize ${
                        st.status === "active" ? "bg-emerald-50 text-emerald-700" : st.status === "completed" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
                      }`}>{st.status}</span>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No students match.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t text-xs">
            <span className="text-muted-foreground">Page {page + 1} of {pageCount}</span>
            <div className="flex gap-2">
              <button className="rounded border px-2.5 py-1 disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
              <button className="rounded border px-2.5 py-1 disabled:opacity-40" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </GlassCard>
      </BrandBody>
    </>
  );
}
