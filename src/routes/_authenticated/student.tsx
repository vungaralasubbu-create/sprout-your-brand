import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/student/student-shell";

export const Route = createFileRoute("/_authenticated/student")({
  component: StudentShell,
});
