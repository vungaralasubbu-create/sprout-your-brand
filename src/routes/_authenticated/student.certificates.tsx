import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyCertificates } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/certificates")({ component: Page });

function Page() {
  const fn = useServerFn(listMyCertificates);
  const { data = [], isLoading } = useQuery({ queryKey: ["my-certificates"], queryFn: () => fn() });

  function downloadPdf(cert: any) {
    // Simple print-based PDF: open a new tab with printable certificate
    const html = certificateHTML(cert);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight">Certificates</h1>
        <p className="mt-1 text-muted-foreground text-sm">Every certificate issued after you complete a Glintr course.</p>
      </div>
      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      {!isLoading && data.length === 0 && (
        <Card className="p-10 text-center">
          <Award className="size-8 mx-auto text-muted-foreground mb-2" />
          <div className="font-display text-lg mb-1">No certificates yet</div>
          <div className="text-sm text-muted-foreground mb-4">Complete a course to earn your first certificate.</div>
          <Button asChild><Link to="/student/courses">Go to My Courses</Link></Button>
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.map((c: any) => (
          <Card key={c.id} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Award className="size-6 text-primary" />
              <Badge variant="success">Issued</Badge>
            </div>
            <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{c.certificate_type}</div>
            <div className="mt-1 font-display text-lg font-semibold leading-snug">{c.course_name}</div>
            <div className="mt-2 text-sm">{c.student_name}</div>
            <div className="mt-3 space-y-0.5 text-[11px] font-mono text-muted-foreground">
              <div>ID: {c.certificate_number}</div>
              <div>Verify: {c.verification_code}</div>
              <div>{new Date(c.completion_date ?? c.issued_at).toLocaleDateString()}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => downloadPdf(c)}><Download className="size-4" /> Download</Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/verify-certificate/$code" params={{ code: c.verification_code }}>Verify</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function certificateHTML(c: any) {
  const date = new Date(c.completion_date ?? c.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return `<!doctype html><html><head><meta charset="utf-8"><title>${c.certificate_number}</title>
<style>
  body{font-family: Georgia, 'Times New Roman', serif; margin:0; padding:0; background:#fff; color:#0b1f3a;}
  .cert{width:1000px; margin:40px auto; padding:60px; border:2px solid #0b1f3a; position:relative;}
  .brand{font-family:'Inter', sans-serif; font-weight:700; font-size:36px; letter-spacing:-.02em;}
  .accent{width:60px; height:4px; background:linear-gradient(90deg,#22d3ee,#3b82f6,#84cc16); margin:20px 0;}
  h1{font-size:44px; margin:20px 0 6px;}
  .name{font-size:36px; margin:30px 0 8px; font-style:italic;}
  .course{font-size:22px; margin-top:10px;}
  .meta{display:flex; justify-content:space-between; margin-top:60px; font-size:12px; font-family:'Inter',sans-serif;}
  .box{background:#f8fafc; padding:16px; border-radius:8px;}
  .type{font-family:'Inter',sans-serif; text-transform:uppercase; letter-spacing:.15em; font-size:11px; color:#64748b;}
</style></head><body>
<div class="cert">
  <div class="brand">glintr</div>
  <div class="accent"></div>
  <div class="type">${escapeHtml(c.certificate_type)}</div>
  <h1>Certificate of Completion</h1>
  <div style="font-size:14px; color:#475569;">This is to certify that</div>
  <div class="name">${escapeHtml(c.student_name)}</div>
  <div style="font-size:14px; color:#475569;">has successfully completed the program</div>
  <div class="course"><strong>${escapeHtml(c.course_name)}</strong></div>
  <div class="meta">
    <div class="box"><div class="type">Completion Date</div><div>${date}</div></div>
    <div class="box"><div class="type">Certificate ID</div><div>${escapeHtml(c.certificate_number)}</div></div>
    <div class="box"><div class="type">Verification Code</div><div>${escapeHtml(c.verification_code)}</div></div>
  </div>
  <div style="margin-top:30px; font-size:11px; color:#64748b;">Verify at /verify-certificate/${escapeHtml(c.verification_code)}</div>
</div>
</body></html>`;
}
function escapeHtml(s: any) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"} as any)[c]); }
