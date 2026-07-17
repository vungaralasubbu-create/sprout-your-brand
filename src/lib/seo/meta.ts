/**
 * Automatic meta generators — title (50–60 chars) and description (140–160 chars).
 * Every generator falls back to sensible defaults so no page ever ships empty metadata.
 */

const BRAND = "Glintr";
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

function clampTitle(base: string, suffix = `| ${BRAND}`): string {
  const full = `${base} ${suffix}`.trim();
  if (full.length <= TITLE_MAX) return full;
  const room = TITLE_MAX - suffix.length - 1;
  return `${base.slice(0, Math.max(10, room - 1)).trimEnd()}… ${suffix}`;
}

function clampDescription(base: string, filler?: string): string {
  let d = base.trim().replace(/\s+/g, " ");
  if (d.length >= DESC_MIN && d.length <= DESC_MAX) return d;
  if (d.length > DESC_MAX) return d.slice(0, DESC_MAX - 1).replace(/[,.;:\s]+\S*$/, "") + "…";
  if (filler) d = `${d} ${filler}`.trim();
  if (d.length < DESC_MIN) {
    d = `${d} Learn with ${BRAND} — live cohorts, projects, mentor support, and career outcomes.`;
  }
  if (d.length > DESC_MAX) d = d.slice(0, DESC_MAX - 1) + "…";
  return d;
}

/** Course detail page. */
export function courseTitle(name: string, tagline = "Live Training + Projects") {
  return clampTitle(`${name} Course | ${tagline}`);
}
export function courseDescription(name: string, short?: string | null, duration?: string | null, level?: string | null) {
  const bits = [
    short?.trim() || `Master ${name} with hands-on projects, live mentorship, and an industry-recognised certification.`,
    duration ? `Duration: ${duration}.` : "",
    level ? `Level: ${level}.` : "",
  ].filter(Boolean).join(" ");
  return clampDescription(bits);
}

/** Category / collection page. */
export function categoryTitle(name: string) {
  return clampTitle(`${name} Programs | Courses & Certifications`);
}
export function categoryDescription(name: string, count?: number, short?: string | null) {
  const base = short?.trim() || `Explore ${count ?? "curated"} ${name} programs with live cohorts, industry projects, and placement support.`;
  return clampDescription(base);
}

/** Blog article. */
export function blogTitle(title: string) {
  return clampTitle(title);
}
export function blogDescription(excerpt?: string | null, title?: string) {
  const base = excerpt?.trim() || `Read ${title ?? "this guide"} on ${BRAND} — expert insights, examples, and actionable takeaways for professionals and students.`;
  return clampDescription(base);
}

/** Learning path. */
export function learningPathTitle(name: string) {
  return clampTitle(`${name} Learning Path | Structured Roadmap`);
}
export function learningPathDescription(name: string, weeks?: number, short?: string | null) {
  const base = short?.trim() || `Follow the ${name} learning path — a structured roadmap${weeks ? ` across ${weeks} weeks` : ""} covering fundamentals to advanced skills with projects and mentors.`;
  return clampDescription(base);
}

/** Career / role page. */
export function careerTitle(role: string) {
  return clampTitle(`Career Guide to ${role} in 2026`);
}
export function careerDescription(role: string, short?: string | null) {
  const base = short?.trim() || `Everything you need to launch a ${role} career — salary benchmarks, skills, learning path, and interview prep tailored for the Indian market.`;
  return clampDescription(base);
}

/** Partner brand / white-label page. */
export function partnerBrandTitle(brand: string) {
  return clampTitle(`${brand} | AI-Powered Education Brand`);
}
export function partnerBrandDescription(brand: string, tagline?: string | null) {
  const base = tagline?.trim() || `${brand} is an AI-powered education brand delivering live programs, certifications, and career outcomes — powered by the Glintr operating system.`;
  return clampDescription(base);
}

/** Generic / static marketing page. */
export function pageTitle(title: string, suffix?: string) {
  return clampTitle(title, suffix ? `| ${suffix}` : `| ${BRAND}`);
}
export function pageDescription(base: string) {
  return clampDescription(base);
}

/** Quality checks used by the health dashboard. */
export function auditMeta(title: string | null | undefined, description: string | null | undefined) {
  const issues: string[] = [];
  const t = (title ?? "").trim();
  const d = (description ?? "").trim();
  if (!t) issues.push("missing_title");
  else if (t.length < 30) issues.push("title_too_short");
  else if (t.length > TITLE_MAX + 5) issues.push("title_too_long");
  if (!d) issues.push("missing_description");
  else if (d.length < DESC_MIN - 20) issues.push("description_too_short");
  else if (d.length > DESC_MAX + 20) issues.push("description_too_long");
  return { ok: issues.length === 0, issues };
}
