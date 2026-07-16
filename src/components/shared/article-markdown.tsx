import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";

/**
 * Markdown renderer for article/blog content.
 *
 * - Parses GFM (tables, task lists, autolinks, strikethrough).
 * - Interprets embedded raw HTML instead of printing it as text (rehype-raw),
 *   then sanitizes it with an allowlist so `<a id="...">` anchors, headings
 *   with ids, tables, images, code, and lists are all safe.
 * - Auto-generates stable heading ids (rehype-slug) so table-of-contents
 *   links resolve without authors having to hand-write `<a id="...">`.
 */

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "section"
  );
}

/**
 * Pull H2/H3 headings from raw Markdown for a TOC. Skips fenced code blocks
 * and matches the id scheme used by rehype-slug (which uses github-slugger
 * — same shape as our fallback slugifier for typical ASCII headings).
 */
export function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split(/\r?\n/);
  const out: Heading[] = [];
  const used = new Map<string, number>();
  let inFence = false;
  for (const raw of lines) {
    if (/^```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+)$/.exec(raw);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    // Strip inline markdown emphasis / code markers from the visible label.
    const text = m[2]
      .trim()
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1");
    let id = slugifyHeading(text);
    const c = used.get(id) ?? 0;
    if (c > 0) id = `${id}-${c}`;
    used.set(id, c + 1);
    out.push({ id, text, level });
  }
  return out;
}

// Sanitize schema: start from the safe default, then allow id on headings
// and anchors (needed for TOC / in-page navigation), plus class on code
// blocks (needed for syntax highlighting styles).
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "id"],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "id",
      "name",
      "target",
      "rel",
    ],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className", "id"],
  },
  // Allow standalone anchor placeholders like <a id="roadmap"></a>.
  tagNames: [...(defaultSchema.tagNames ?? [])],
};

const components: Components = {
  h1: ({ node, ...props }) => (
    <h1
      {...props}
      className="font-display text-3xl md:text-4xl font-semibold mt-14 mb-4 scroll-mt-28"
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      {...props}
      className="font-display text-2xl md:text-3xl font-semibold mt-14 mb-4 scroll-mt-28"
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      {...props}
      className="font-display text-xl font-semibold mt-10 mb-3 scroll-mt-28"
    />
  ),
  h4: ({ node, ...props }) => (
    <h4 {...props} className="font-display text-lg font-semibold mt-8 mb-2 scroll-mt-28" />
  ),
  p: ({ node, ...props }) => (
    <p {...props} className="text-body text-muted-foreground leading-relaxed my-5" />
  ),
  a: ({ node, href, children, id, ...props }) => {
    // Empty anchor placeholder → render an invisible in-page target only.
    const hasText =
      React.Children.count(children) > 0 &&
      React.Children.toArray(children).some((c) =>
        typeof c === "string" ? c.trim().length > 0 : true,
      );
    if (!hasText && !href && id) {
      return <span id={id} aria-hidden="true" className="block h-0 scroll-mt-28" />;
    }
    const external = href?.startsWith("http");
    return (
      <a
        {...props}
        id={id}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        className="text-primary underline underline-offset-4 hover:opacity-80"
      >
        {children}
      </a>
    );
  },
  ul: ({ node, ...props }) => (
    <ul
      {...props}
      className="my-5 space-y-2 list-disc pl-6 text-body text-muted-foreground leading-relaxed marker:text-primary"
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      {...props}
      className="my-5 space-y-2 list-decimal pl-6 text-body text-muted-foreground leading-relaxed marker:text-primary"
    />
  ),
  li: ({ node, ...props }) => <li {...props} className="leading-relaxed" />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      {...props}
      className="my-8 border-l-4 border-primary bg-muted/30 pl-5 py-3 italic text-foreground/90"
    />
  ),
  code: ({ node, className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code {...props} className={className}>
          {children}
        </code>
      );
    }
    return (
      <code
        {...props}
        className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-mono"
      >
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="my-6 overflow-x-auto rounded-xl bg-secondary text-secondary-foreground p-4 text-sm"
    />
  ),
  table: ({ node, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-xl border">
      <table {...props} className="w-full text-sm" />
    </div>
  ),
  thead: ({ node, ...props }) => <thead {...props} className="bg-muted/40" />,
  th: ({ node, ...props }) => (
    <th {...props} className="border-b px-4 py-2 text-left font-semibold" />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border-b px-4 py-2 align-top" />
  ),
  img: ({ node, alt, ...props }) => (
    <img
      {...props}
      alt={alt ?? ""}
      loading="lazy"
      className="my-8 w-full rounded-xl border"
    />
  ),
  hr: ({ node, ...props }) => <hr {...props} className="my-10 border-border" />,
  strong: ({ node, ...props }) => <strong {...props} className="text-foreground font-semibold" />,
};

export function ArticleMarkdown({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={cn("article-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
