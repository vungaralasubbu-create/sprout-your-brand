/**
 * Email branding — resolves per-brand or platform-level branding (logo,
 * colors, socials, contact) and renders a professional header + footer
 * that every outbound email is wrapped in.
 *
 * Server-only. Never import from browser code.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface EmailBrand {
  brand_name: string;
  logo_url: string | null;
  logo_url_dark: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  header_background: string;
  footer_background: string;
  website_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  address: string | null;
  footer_tagline: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  show_partner_logos: boolean;
}

export interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  logo_url_dark: string | null;
  link_url: string | null;
  category: string;
  sort_order: number;
}

const PLATFORM_DEFAULTS: EmailBrand = {
  brand_name: "Glintr",
  logo_url: "https://glintr.com/logo.png",
  logo_url_dark: null,
  favicon_url: "https://glintr.com/favicon.ico",
  primary_color: "#0891b2",
  accent_color: "#84cc16",
  header_background: "#0f172a",
  footer_background: "#0f172a",
  website_url: "https://glintr.com",
  support_email: process.env.SUPPORT_EMAIL ?? "support@glintr.com",
  support_phone: null,
  address: null,
  footer_tagline: "Launch. Sell. Grow.",
  social_twitter: null,
  social_linkedin: null,
  social_instagram: null,
  social_facebook: null,
  social_youtube: null,
  show_partner_logos: true,
};

export async function resolveEmailBrand(brandId?: string | null): Promise<EmailBrand> {
  // Try brand-scoped first, then platform default.
  if (brandId) {
    const { data } = await supabaseAdmin
      .from("email_brand_settings")
      .select("*")
      .eq("brand_id", brandId)
      .maybeSingle();
    if (data) return mergeBrand(data as never);
  }
  const { data: platform } = await supabaseAdmin
    .from("email_brand_settings")
    .select("*")
    .eq("is_platform", true)
    .maybeSingle();
  return mergeBrand((platform ?? {}) as never);
}

function mergeBrand(row: Partial<EmailBrand>): EmailBrand {
  const merged = { ...PLATFORM_DEFAULTS };
  for (const key of Object.keys(PLATFORM_DEFAULTS) as (keyof EmailBrand)[]) {
    const v = row[key];
    if (v !== null && v !== undefined && v !== "") {
      (merged as Record<string, unknown>)[key] = v;
    }
  }
  return merged;
}

export async function resolvePartnerLogos(brandId?: string | null): Promise<PartnerLogo[]> {
  // If brand has its own logos, use them; otherwise fall back to global.
  if (brandId) {
    const { data: own } = await supabaseAdmin
      .from("email_partner_logos")
      .select("id,name,logo_url,logo_url_dark,link_url,category,sort_order")
      .eq("brand_id", brandId)
      .eq("enabled", true)
      .order("sort_order", { ascending: true });
    if (own && own.length > 0) return own as PartnerLogo[];
  }
  const { data: global } = await supabaseAdmin
    .from("email_partner_logos")
    .select("id,name,logo_url,logo_url_dark,link_url,category,sort_order")
    .is("brand_id", null)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  return (global ?? []) as PartnerLogo[];
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}

export function renderEmailHeader(brand: EmailBrand): string {
  const logo = brand.logo_url
    ? `<img src="${esc(brand.logo_url)}" alt="${esc(brand.brand_name)}" width="140" height="40" loading="lazy" style="display:block;max-height:40px;width:auto;border:0;outline:none;text-decoration:none" />`
    : `<div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.01em">${esc(brand.brand_name)}</div>`;
  const homeUrl = brand.website_url ?? "#";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${esc(brand.header_background)}">
    <tr><td align="center" style="padding:24px 32px">
      <a href="${esc(homeUrl)}" style="text-decoration:none;display:inline-block">${logo}</a>
    </td></tr>
  </table>`;
}

function socialIcon(url: string, name: string, svg: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;margin:0 6px;text-decoration:none" aria-label="${esc(name)}">
    <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:rgba(255,255,255,0.08);border-radius:50%;color:#ffffff;font-size:12px">${svg}</span>
  </a>`;
}

function renderSocials(brand: EmailBrand): string {
  const parts: string[] = [];
  if (brand.social_twitter) parts.push(socialIcon(brand.social_twitter, "Twitter", "𝕏"));
  if (brand.social_linkedin) parts.push(socialIcon(brand.social_linkedin, "LinkedIn", "in"));
  if (brand.social_instagram) parts.push(socialIcon(brand.social_instagram, "Instagram", "◎"));
  if (brand.social_facebook) parts.push(socialIcon(brand.social_facebook, "Facebook", "f"));
  if (brand.social_youtube) parts.push(socialIcon(brand.social_youtube, "YouTube", "▶"));
  if (parts.length === 0) return "";
  return `<div style="margin:16px 0 12px 0">${parts.join("")}</div>`;
}

export function renderPartnerLogoStrip(brand: EmailBrand, logos: PartnerLogo[]): string {
  if (!brand.show_partner_logos || logos.length === 0) return "";
  const cells = logos.slice(0, 12).map((l) => {
    const img = `<img src="${esc(l.logo_url)}" alt="${esc(l.name)}" height="28" loading="lazy" style="max-height:28px;width:auto;filter:brightness(0) invert(1);opacity:0.85;border:0;display:inline-block" />`;
    return l.link_url
      ? `<td style="padding:8px 14px" align="center"><a href="${esc(l.link_url)}" style="text-decoration:none">${img}</a></td>`
      : `<td style="padding:8px 14px" align="center">${img}</td>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;border-top:1px solid rgba(255,255,255,0.06)">
    <tr><td align="center" style="padding:20px 24px">
      <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px">Trusted by leading platforms</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>${cells}</tr></table>
    </td></tr>
  </table>`;
}

export function renderEmailFooter(brand: EmailBrand, logos: PartnerLogo[] = []): string {
  const contactBits: string[] = [];
  if (brand.support_email) contactBits.push(`<a href="mailto:${esc(brand.support_email)}" style="color:#cbd5e1;text-decoration:none">${esc(brand.support_email)}</a>`);
  if (brand.support_phone) contactBits.push(`<span style="color:#cbd5e1">${esc(brand.support_phone)}</span>`);
  if (brand.website_url) contactBits.push(`<a href="${esc(brand.website_url)}" style="color:#cbd5e1;text-decoration:none">${esc(brand.website_url.replace(/^https?:\/\//, ""))}</a>`);
  const contact = contactBits.length
    ? `<div style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:10px">${contactBits.join(' &nbsp;·&nbsp; ')}</div>`
    : "";
  const address = brand.address
    ? `<div style="color:#64748b;font-size:12px;line-height:1.6;margin-bottom:12px">${esc(brand.address)}</div>`
    : "";
  const tagline = brand.footer_tagline
    ? `<div style="color:#94a3b8;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin-top:6px">${esc(brand.footer_tagline)}</div>`
    : "";

  return `${renderPartnerLogoStrip(brand, logos)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${esc(brand.footer_background)}">
    <tr><td align="center" style="padding:28px 32px 32px 32px">
      ${renderSocials(brand)}
      ${contact}
      ${address}
      <div style="color:#64748b;font-size:11px;line-height:1.6">
        © ${new Date().getFullYear()} ${esc(brand.brand_name)}. All rights reserved.<br />
        You're receiving this because you have an account with ${esc(brand.brand_name)}.
        <br /><a href="{{unsubscribe_url}}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a> · <a href="{{preferences_url}}" style="color:#94a3b8;text-decoration:underline">Manage preferences</a>
      </div>
      ${tagline}
    </td></tr>
  </table>`;
}

/**
 * Wrap raw HTML content in a branded shell. If `bodyHtml` already contains a
 * `<!DOCTYPE` declaration we assume it is a full document and only inject
 * the header/footer into a wrapper around the existing body markup.
 */
export function wrapWithBrandedShell(
  bodyHtml: string,
  brand: EmailBrand,
  logos: PartnerLogo[],
  preview?: string,
): string {
  const header = renderEmailHeader(brand);
  const footer = renderEmailFooter(brand, logos);
  const previewText = preview
    ? `<div style="display:none;overflow:hidden;line-height:1;opacity:0;max-height:0;max-width:0">${esc(preview)}</div>`
    : "";
  // Strip an outer <html>/<body> wrapper if present so we don't nest documents.
  const inner = bodyHtml
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "")
    .trim() || bodyHtml;

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
${brand.favicon_url ? `<link rel="icon" href="${esc(brand.favicon_url)}" />` : ""}
<title>${esc(brand.brand_name)}</title>
<style>
  @media (max-width:600px){
    .glintr-shell{width:100% !important;border-radius:0 !important}
    .glintr-body{padding:24px !important}
  }
  @media (prefers-color-scheme: dark){
    .glintr-body{background:#0b1220 !important;color:#e2e8f0 !important}
    .glintr-body p{color:#cbd5e1 !important}
    .glintr-body h1,.glintr-body h2{color:#f8fafc !important}
  }
</style>
</head>
<body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased">
${previewText}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" class="glintr-shell" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">
      <tr><td>${header}</td></tr>
      <tr><td class="glintr-body" style="padding:36px 36px 28px 36px;background:#ffffff;color:#0f172a">${inner}</td></tr>
      <tr><td>${footer}</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
