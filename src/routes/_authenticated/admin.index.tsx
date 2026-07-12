import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, FolderTree, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

async function counts() {
  const [cats, courses, apps, published] = await Promise.all([
    supabase.from("course_categories").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("course_applications").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  return {
    categories: cats.count ?? 0,
    courses: courses.count ?? 0,
    applications: apps.count ?? 0,
    published: published.count ?? 0,
  };
}

function Dashboard() {
  const { data } = useQuery({ queryKey: ["admin-counts"], queryFn: counts });
  const cards = [
    { label: "Categories", value: data?.categories ?? "—", icon: FolderTree, to: "/admin/categories" },
    { label: "Courses", value: data?.courses ?? "—", icon: GraduationCap, to: "/admin/courses" },
    { label: "Published", value: data?.published ?? "—", icon: GraduationCap, to: "/admin/courses" },
    { label: "Applications", value: data?.applications ?? "—", icon: FileText, to: "/admin/applications" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-heading-xl font-display font-semibold">Overview</h2>
        <p className="text-muted-foreground mt-1">Manage your course catalogue and applications.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card-elevated hover:card-elevated-hover p-5">
            <div className="flex items-center justify-between">
              <span className="text-caption">{c.label}</span>
              <c.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-display font-semibold">{c.value}</div>
          </Link>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/courses" className="card-elevated p-6 hover:card-elevated-hover">
          <div className="flex items-center gap-3 mb-2"><GraduationCap className="size-5 text-primary" /><span className="font-medium">Create a new course</span></div>
          <p className="text-caption">Guided 10-step builder — basics, pricing, curriculum, skills, SEO.</p>
        </Link>
        <Link to="/admin/categories" className="card-elevated p-6 hover:card-elevated-hover">
          <div className="flex items-center gap-3 mb-2"><FolderTree className="size-5 text-primary" /><span className="font-medium">Manage categories</span></div>
          <p className="text-caption">Publish, reorder, or archive program categories.</p>
        </Link>
      </div>
    </div>
  );
}
