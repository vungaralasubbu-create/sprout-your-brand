import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/v1/certificates/verify/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = String(params.code ?? "").trim();
        if (!code || code.length > 128 || !/^[a-zA-Z0-9-]+$/.test(code)) {
          return Response.json({ valid: false, error: "invalid_code" }, { status: 400 });
        }

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) {
          return Response.json({ valid: false, error: "server_unconfigured" }, { status: 500 });
        }

        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                h.delete("Authorization");
              }
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const { data, error } = await supabase
          .from("certificates")
          .select("id, verification_code, issued_at, status, course_id, student_name, certificate_type")
          .eq("verification_code", code)
          .maybeSingle();

        if (error || !data) {
          return Response.json({ valid: false }, { status: 404 });
        }

        return Response.json(
          {
            valid: data.status === "issued" || data.status === "active",
            certificate: {
              id: data.id,
              code: data.verification_code,
              issuedAt: data.issued_at,
              status: data.status,
              type: data.certificate_type,
              student: data.student_name,
              courseId: data.course_id,
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
