import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStudentContext } from "@/lib/student/lms.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/student/profile")({ component: Page });

function Page() {
  const fn = useServerFn(getStudentContext);
  const { data } = useQuery({ queryKey: ["student-context"], queryFn: () => fn() });
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="text-3xl font-display font-semibold tracking-tight">Profile</h1>
      <Card className="p-6 mt-6">
        <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Name</div>
        <div className="mt-0.5 text-lg font-semibold">{data?.displayName}</div>
        <div className="mt-4 text-caption font-mono uppercase tracking-widest text-muted-foreground">Email</div>
        <div className="mt-0.5 text-sm">{data?.email}</div>
        <div className="mt-6">
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}
