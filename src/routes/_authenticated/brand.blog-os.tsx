import { createFileRoute } from "@tanstack/react-router";
import BlogOsAdmin from "./admin.blog-os";

export const Route = createFileRoute("/_authenticated/brand/blog-os")({
  component: BrandBlogOs,
});

function BrandBlogOs() {
  return <BlogOsAdmin />;
}
