import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/verify-certificate/$code")({
  head: () => ({
    meta: [
      { title: "Verify Certificate — Glintr" },
      { name: "description", content: "Verify the authenticity of a Glintr certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { code } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify-cert", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_certificate", { _code: code });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    },
  });

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_240)]">
      <div className="max-w-2xl mx-auto p-6 lg:p-10">
        <Link to="/" className="font-display text-xl font-semibold">glintr</Link>
        <h1 className="mt-6 text-3xl font-display font-semibold tracking-tight">Certificate Verification</h1>

        {isLoading && <div className="mt-6 text-muted-foreground">Verifying…</div>}

        {!isLoading && !data && (
          <Card className="mt-6 p-8">
            <div className="flex items-center gap-3">
              <XCircle className="size-8 text-rose-600" />
              <div>
                <div className="font-display text-xl font-semibold">Certificate Not Found</div>
                <div className="text-sm text-muted-foreground">The verification code did not match any Glintr certificate.</div>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && data && (
          <Card className="mt-6 p-8">
            <div className="flex items-center gap-3 mb-4">
              {data.is_valid
                ? <CheckCircle2 className="size-8 text-emerald-600" />
                : <XCircle className="size-8 text-rose-600" />}
              <div>
                <div className="font-display text-xl font-semibold">
                  {data.is_valid ? "Certificate Valid" : "Certificate Revoked"}
                </div>
                <div className="text-sm text-muted-foreground">Issued by Glintr</div>
              </div>
              <Award className="ml-auto size-6 text-primary" />
            </div>
            <div className="space-y-3">
              <Row label="Student Name" value={data.student_name} />
              <Row label="Course Name" value={data.course_name} />
              <Row label="Type" value={<Badge variant="muted">{data.certificate_type}</Badge>} />
              <Row label="Completion Date" value={new Date(data.completion_date).toLocaleDateString()} />
              <Row label="Certificate ID" value={<span className="font-mono">{data.certificate_number}</span>} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 last:border-0">
      <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}
