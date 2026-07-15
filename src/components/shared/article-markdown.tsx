import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny safe Markdown renderer for blog article content.
 * Supports: H2/H3 (with anchor ids), paragraphs, unordered lists,
 * ordered lists, blockquotes, inline code, code fences, bold, italic.
 * All output is React nodes — no dangerouslySetInnerHTML, no script execution.
 */

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}

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
    const text = m[2].trim();
    let id = slugifyHeading(text);
    const c = used.get(id) ?? 0;
    if (c > 0) id = `${id}-${c}`;
    used.set(id, c + 1);
    out.push({ id, text, level });
  }
  return out;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // order matters: code -> bold -> italic
  const nodes: React.ReactNode[] = [];
  let key = 0;
  const push = (n: React.ReactNode) => nodes.push(<React.Fragment key={`${keyPrefix}-${key++}`}>{n}</React.Fragment>);
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) push(<code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) push(<strong>{tok.slice(2, -2)}</strong>);
    else push(<em>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) push(text.slice(last));
  return nodes;
}

interface Block {
  type: "p" | "h2" | "h3" | "ul" | "ol" | "quote" | "code";
  content?: string;
  items?: string[];
  lang?: string;
}

function parse(markdown: string): { blocks: Block[]; anchors: Heading[] } {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const used = new Map<string, number>();
  const anchors: Heading[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // code fence
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: "code", content: buf.join("\n"), lang });
      continue;
    }
    // heading
    const h = /^(#{2,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length as 2 | 3;
      const text = h[2].trim();
      let id = slugifyHeading(text);
      const c = used.get(id) ?? 0;
      if (c > 0) id = `${id}-${c}`;
      used.set(id, c + 1);
      anchors.push({ id, text, level });
      blocks.push({ type: level === 2 ? "h2" : "h3", content: `${id}::${text}` });
      i++;
      continue;
    }
    // quote
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { buf.push(lines[i].slice(2)); i++; }
      blocks.push({ type: "quote", content: buf.join(" ") });
      continue;
    }
    // unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    // paragraph (single or multi-line until blank)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>\s|[-*]\s|\d+\.\s|```)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: buf.join(" ") });
  }
  return { blocks, anchors };
}

export function ArticleMarkdown({ markdown, className }: { markdown: string; className?: string }) {
  const { blocks } = React.useMemo(() => parse(markdown), [markdown]);
  return (
    <div className={cn("article-body", className)}>
      {blocks.map((b, idx) => {
        if (b.type === "h2") {
          const [id, text] = (b.content ?? "").split("::");
          return (
            <h2 key={idx} id={id} className="font-display text-2xl md:text-3xl font-semibold mt-14 mb-4 scroll-mt-28">
              {text}
            </h2>
          );
        }
        if (b.type === "h3") {
          const [id, text] = (b.content ?? "").split("::");
          return (
            <h3 key={idx} id={id} className="font-display text-xl font-semibold mt-10 mb-3 scroll-mt-28">
              {text}
            </h3>
          );
        }
        if (b.type === "p") {
          return (
            <p key={idx} className="text-body text-muted-foreground leading-relaxed my-5">
              {renderInline(b.content ?? "", `p-${idx}`)}
            </p>
          );
        }
        if (b.type === "quote") {
          return (
            <blockquote key={idx} className="my-8 border-l-4 border-primary bg-muted/30 pl-5 py-3 italic text-foreground/90">
              {renderInline(b.content ?? "", `q-${idx}`)}
            </blockquote>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="my-5 space-y-2 list-disc pl-6 text-body text-muted-foreground leading-relaxed marker:text-primary">
              {b.items!.map((it, i) => <li key={i}>{renderInline(it, `ul-${idx}-${i}`)}</li>)}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="my-5 space-y-2 list-decimal pl-6 text-body text-muted-foreground leading-relaxed marker:text-primary">
              {b.items!.map((it, i) => <li key={i}>{renderInline(it, `ol-${idx}-${i}`)}</li>)}
            </ol>
          );
        }
        if (b.type === "code") {
          return (
            <pre key={idx} className="my-6 overflow-x-auto rounded-xl bg-secondary text-secondary-foreground p-4 text-sm">
              <code>{b.content}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}
