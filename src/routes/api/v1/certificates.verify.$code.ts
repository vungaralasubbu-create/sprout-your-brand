import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/certificates/verify/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = String(params.code ?? "").trim();
        if (!code || code.length > 128 || !/^[a-zA-Z0-9-]+$/.test(code)) {
          return Response.json({ valid: false, error: "invalid_code" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("certificates")
          .select(
            "id, verification_code, certificate_number, issued_at, revoked_at, course_name, student_name, certificate_type, completion_date",
          )
          .eq("verification_code", code)
          .maybeSingle();

        if (error || !data) {
          return Response.json({ valid: false }, { status: 404 });
        }

        const valid = !data.revoked_at;
        return Response.json(
          {
            valid,
            certificate: {
              id: data.id,
              code: data.verification_code,
              number: data.certificate_number,
              issuedAt: data.issued_at,
              revokedAt: data.revoked_at,
              type: data.certificate_type,
              student: data.student_name,
              course: data.course_name,
              completionDate: data.completion_date,
            },
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
            },
          },
        );
      },
    },
  },
});
