/**
 * Smart popup configuration + analytics helpers.
 *
 * Frequency & dismissal state lives in localStorage (persists 7 days),
 * session-level "shown once" state lives in sessionStorage.
 * Admin config lives in localStorage under `glintr_popup_config_v1`.
 */

const isBrowser = () => typeof window !== "undefined";

export const POPUP_CONFIG_KEY = "glintr_popup_config_v1";
const DISMISS_KEY = "glintr_popup_dismissed_v1"; // localStorage: timestamp of last dismissal
const SUBMIT_KEY = "glintr_popup_submitted_v1"; // localStorage: "1" if form submitted
const SESSION_SHOWN_KEY = "glintr_popup_session_shown_v1"; // sessionStorage
const METRICS_KEY = "glintr_popup_metrics_v1"; // localStorage aggregate counters

export interface PopupConfig {
  enabled: boolean;
  delaySeconds: number; // time trigger
  scrollPercent: number; // scroll trigger (0-100)
  exitIntent: boolean; // desktop exit intent
  reshowDays: number; // days to wait after dismissal
  mobileBehavior: "bottom-sheet" | "disabled";
  abVariant: "A" | "B";
}

export const DEFAULT_CONFIG: PopupConfig = {
  enabled: true,
  delaySeconds: 45,
  scrollPercent: 50,
  exitIntent: true,
  reshowDays: 7,
  mobileBehavior: "bottom-sheet",
  abVariant: "A",
};

export function loadPopupConfig(): PopupConfig {
  if (!isBrowser()) return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(POPUP_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<PopupConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePopupConfig(cfg: PopupConfig) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(POPUP_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export function canShowPopup(cfg: PopupConfig): boolean {
  if (!isBrowser()) return false;
  if (!cfg.enabled) return false;
  try {
    if (localStorage.getItem(SUBMIT_KEY) === "1") return false;
    if (sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") return false;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt) {
      const gap = cfg.reshowDays * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < gap) return false;
    }
  } catch {
    return false;
  }
  return true;
}

export function markPopupShown() {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
  } catch {
    /* ignore */
  }
  bumpMetric("shown");
}

export function markPopupDismissed() {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  bumpMetric("dismissed");
}

export function markPopupSubmitted() {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SUBMIT_KEY, "1");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  bumpMetric("submitted");
}

export function resetPopupCampaign() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(DISMISS_KEY);
    localStorage.removeItem(SUBMIT_KEY);
    sessionStorage.removeItem(SESSION_SHOWN_KEY);
    localStorage.removeItem(METRICS_KEY);
  } catch {
    /* ignore */
  }
}

export interface PopupMetrics {
  shown: number;
  dismissed: number;
  submitted: number;
}

export function readMetrics(): PopupMetrics {
  if (!isBrowser()) return { shown: 0, dismissed: 0, submitted: 0 };
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return { shown: 0, dismissed: 0, submitted: 0 };
    return { shown: 0, dismissed: 0, submitted: 0, ...(JSON.parse(raw) as Partial<PopupMetrics>) };
  } catch {
    return { shown: 0, dismissed: 0, submitted: 0 };
  }
}

function bumpMetric(k: keyof PopupMetrics) {
  if (!isBrowser()) return;
  try {
    const m = readMetrics();
    m[k] = (m[k] ?? 0) + 1;
    localStorage.setItem(METRICS_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}
