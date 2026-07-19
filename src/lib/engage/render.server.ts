/**
 * Template rendering — merges a template body with recipient context and
 * produces a RenderedMessage ready for a provider adapter to send.
 *
 * Supports both DB-backed engage_templates rows and inline
 * SystemTemplateSpec fallbacks so a send can never fail purely because a
 * tenant hasn't customised a template yet.
 */

import { SYSTEM_TEMPLATES, type SystemTemplateSpec } from "./constants";
import type { RenderedMessage } from "./types";

export interface RenderContext {
  recipient: string;
  first_name?: string;
  brand_name?: string;
  app_url?: string;
  [key: string]: unknown;
}

/** Simple `{{token}}` interpolation. Missing tokens become empty strings. */
export function interpolate(source: string, ctx: RenderContext): string {
  return source.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
      return undefined;
    }, ctx);
    return value == null ? "" : String(value);
  });
}

export interface StoredTemplateRow {
  template_key: string;
  subject: string | null;
  preview_text: string | null;
  body_html: string | null;
  body_text: string | null;
  body_json: unknown;
  channel: string;
}

export interface RenderableTemplate {
  key: string;
  channel: "email" | "push" | "inapp";
  subject: string;
  preview: string;
  html: string;
  text: string;
  headline?: string;
  cta_label?: string;
  cta_url?: string;
}

function specToRenderable(spec: SystemTemplateSpec): RenderableTemplate {
  return {
    key: spec.key,
    channel: spec.channel as "email" | "push" | "inapp",
    subject: spec.subject,
    preview: spec.preview,
    html: defaultHtml(spec),
    text: `${spec.headline}\n\n${spec.body}${spec.cta_url ? `\n\n${spec.cta_label ?? "Open"}: ${spec.cta_url}` : ""}`,
    headline: spec.headline,
    cta_label: spec.cta_label,
    cta_url: spec.cta_url,
  };
}

/** Fallback HTML shell used when no tenant HTML override exists. */
export function defaultHtml(spec: {
  headline: string;
  body: string;
  cta_label?: string;
  cta_url?: string;
  preview: string;
}): string {
  const bodyHtml = spec.body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;color:#334155;line-height:1.6;font-size:15px">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const cta = spec.cta_url && spec.cta_label
    ? `<div style="margin-top:24px"><a href="${escapeAttr(spec.cta_url)}" style="display:inline-block;padding:12px 22px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">${escapeHtml(spec.cta_label)}</a></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(spec.headline)}</title></head>
<body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="display:none;overflow:hidden;line-height:1;opacity:0;max-height:0;max-width:0">${escapeHtml(spec.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.06);padding:36px">
        <tr><td>
          <h1 style="margin:0 0 20px 0;color:#0f172a;font-size:24px;line-height:1.3;letter-spacing:-0.01em">${escapeHtml(spec.headline)}</h1>
          ${bodyHtml}
          ${cta}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 20px 0" />
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">You're receiving this because you have an account on Glintr. Manage your preferences or unsubscribe from marketing emails anytime.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

/** Resolve a template to render. Prefers the tenant override, then the
 *  platform row, then the shipped system spec. */
export async function resolveTemplate(
  templateKey: string,
  opts: { brandId?: string | null; locale?: string; stored?: StoredTemplateRow | null },
): Promise<RenderableTemplate | null> {
  if (opts.stored) {
    const s = opts.stored;
    return {
      key: s.template_key,
      channel: (s.channel as "email" | "push" | "inapp") ?? "email",
      subject: s.subject ?? "",
      preview: s.preview_text ?? "",
      html: s.body_html ?? "",
      text: s.body_text ?? "",
    };
  }
  const spec = SYSTEM_TEMPLATES.find((t) => t.key === templateKey);
  return spec ? specToRenderable(spec) : null;
}

/** Convenience: fully render a resolved template with a context. */
export function renderTemplate(
  template: RenderableTemplate,
  ctx: RenderContext,
): RenderedMessage {
  return {
    recipient: ctx.recipient,
    channel: template.channel,
    subject: interpolate(template.subject ?? "", ctx),
    preview_text: interpolate(template.preview ?? "", ctx),
    html: interpolate(template.html ?? "", ctx),
    text: interpolate(template.text ?? "", ctx),
    push_title: interpolate(template.subject ?? "", ctx),
    push_body: interpolate(template.preview ?? "", ctx),
    push_url: interpolate(template.cta_url ?? "", ctx),
    metadata: { template_key: template.key },
  };
}
