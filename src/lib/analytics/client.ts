/**
 * Glintr analytics client.
 *
 * - Loads GA4, Google Tag Manager, Meta Pixel, and Google Ads only when the
 *   corresponding Admin ID is configured.
 * - Never sends sensitive data (PII beyond basic contact captured server-side,
 *   bank / PAN / passwords / private student data / lead notes).
 * - Prevents duplicate conversion events on page refresh via sessionStorage.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    __glintr_analytics_loaded?: boolean;
  }
}

export type AnalyticsSettings = {
  ga4_id: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  google_ads_id: string | null;
};

export type GlintrEvent =
  | "program_view"
  | "apply_now_click"
  | "application_submitted"
  | "counsellor_request"
  | "whatsapp_click"
  | "partner_signup"
  | "brand_application"
  | "student_signup";

// Events that count as conversions — deduped per session.
const CONVERSION_EVENTS: GlintrEvent[] = [
  "application_submitted",
  "counsellor_request",
  "partner_signup",
  "brand_application",
  "student_signup",
];

// Payload keys we explicitly refuse to forward — belt-and-suspenders against
// accidental leakage from callers.
const BLOCKED_KEYS = new Set([
  "password",
  "pan",
  "pan_number",
  "aadhaar",
  "bank",
  "bank_account",
  "account_number",
  "ifsc",
  "notes",
  "lead_notes",
  "internal_notes",
  "email",
  "mobile",
  "phone",
  "full_name",
  "name",
  "dob",
  "address",
]);

function sanitize(payload: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v == null) continue;
    if (BLOCKED_KEYS.has(k.toLowerCase())) continue;
    if (typeof v === "object") continue;
    out[k] = v;
  }
  return out;
}

function injectScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

function initDataLayer() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

let currentSettings: AnalyticsSettings = {
  ga4_id: null,
  gtm_id: null,
  meta_pixel_id: null,
  google_ads_id: null,
};

export function loadAnalytics(settings: AnalyticsSettings) {
  if (typeof window === "undefined") return;
  if (window.__glintr_analytics_loaded) return;
  currentSettings = settings;

  const { ga4_id, gtm_id, meta_pixel_id, google_ads_id } = settings;

  if (ga4_id || google_ads_id || gtm_id) initDataLayer();

  if (ga4_id) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${ga4_id}`, "glintr-ga4");
    window.gtag!("js", new Date());
    window.gtag!("config", ga4_id, { send_page_view: true, anonymize_ip: true });
  }

  if (google_ads_id) {
    if (!ga4_id) {
      injectScript(
        `https://www.googletagmanager.com/gtag/js?id=${google_ads_id}`,
        "glintr-gads",
      );
      window.gtag!("js", new Date());
    }
    window.gtag!("config", google_ads_id);
  }

  if (gtm_id) {
    if (!document.getElementById("glintr-gtm")) {
      const s = document.createElement("script");
      s.id = "glintr-gtm";
      s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm_id}');`;
      document.head.appendChild(s);
    }
  }

  if (meta_pixel_id) {
    if (!window.fbq) {
      // Meta Pixel base snippet
      // eslint-disable-next-line
      (function (f: any, b: any, e: string, v: string) {
        if (f.fbq) return;
        const n: any = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        const t = b.createElement(e);
        t.async = true;
        t.src = v;
        t.id = "glintr-meta-pixel";
        const s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    }
    window.fbq!("init", meta_pixel_id);
    window.fbq!("track", "PageView");
  }

  window.__glintr_analytics_loaded = true;
}

const META_STANDARD: Partial<Record<GlintrEvent, string>> = {
  program_view: "ViewContent",
  apply_now_click: "InitiateCheckout",
  application_submitted: "Lead",
  counsellor_request: "Lead",
  partner_signup: "CompleteRegistration",
  brand_application: "SubmitApplication",
  student_signup: "CompleteRegistration",
};

function alreadyFired(event: GlintrEvent, dedupeKey: string) {
  if (typeof window === "undefined") return false;
  try {
    const key = `glintr_evt:${event}:${dedupeKey}`;
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
}

export function trackEvent(event: GlintrEvent, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const safe = sanitize(payload);

  // Dedupe conversion events. Use a stable key when the caller supplies one
  // (e.g. course_id for program_view, form id for submissions).
  if (CONVERSION_EVENTS.includes(event)) {
    const dedupeKey =
      safe.dedupe_key ??
      safe.application_id ??
      safe.lead_id ??
      safe.course_id ??
      "global";
    if (alreadyFired(event, String(dedupeKey))) return;
  }
  // Program views are also deduped per course per session so refresh doesn't
  // double-count.
  if (event === "program_view" && safe.course_id) {
    if (alreadyFired(event, String(safe.course_id))) return;
  }

  const { ga4_id, gtm_id, meta_pixel_id, google_ads_id } = currentSettings;

  if ((ga4_id || google_ads_id) && window.gtag) {
    window.gtag("event", event, safe);
  }
  if (gtm_id) {
    window.dataLayer?.push({ event, ...safe });
  }
  if (meta_pixel_id && window.fbq) {
    const std = META_STANDARD[event];
    if (std) window.fbq("track", std, safe);
    window.fbq("trackCustom", event, safe);
  }
}

/** Convenience helpers so callers don't need to know the payload shape. */
export function trackProgramView(course: {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  partner_code?: string | null;
}) {
  trackEvent("program_view", {
    course_id: course.id ?? null,
    course_name: course.name ?? null,
    category: course.category ?? null,
    partner_code: course.partner_code ?? null,
  });
}

export function trackApplyClick(course: {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  partner_code?: string | null;
}) {
  trackEvent("apply_now_click", {
    course_id: course.id ?? null,
    course_name: course.name ?? null,
    category: course.category ?? null,
    partner_code: course.partner_code ?? null,
  });
}
