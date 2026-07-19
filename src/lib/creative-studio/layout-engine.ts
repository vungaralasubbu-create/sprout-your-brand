/**
 * AI Creative Studio — layout engine
 * ----------------------------------
 * Deterministic layout builder used as fallback / hydration for AI-generated
 * design specs. Every design that comes back from the AI is normalized
 * through `buildLayout()` so the editor / renderer always receives a
 * stable shape regardless of model quality.
 */

import type {
  BrandKitSnapshot,
  DesignCopy,
  DesignElement,
  DesignFormat,
  DesignLayout,
  DesignPalette,
  DesignSlide,
  DesignStyle,
  DesignTypography,
} from "./types";
import { FORMAT_SPECS } from "./types";

const FALLBACK_PALETTES: Record<DesignStyle, DesignPalette> = {
  minimal:      { primary: "#111827", secondary: "#6B7280", accent: "#3B82F6", background: "#FFFFFF", foreground: "#111827", muted: "#F3F4F6" },
  modern:       { primary: "#0F172A", secondary: "#334155", accent: "#22D3EE", background: "#F8FAFC", foreground: "#0F172A", muted: "#E2E8F0" },
  corporate:    { primary: "#0B3D91", secondary: "#1E3A8A", accent: "#F59E0B", background: "#FFFFFF", foreground: "#0F172A", muted: "#F1F5F9" },
  startup:      { primary: "#111827", secondary: "#4B5563", accent: "#A3E635", background: "#FFFFFF", foreground: "#111827", muted: "#F9FAFB" },
  glassmorphism:{ primary: "#0EA5E9", secondary: "#38BDF8", accent: "#F472B6", background: "#0F172A", foreground: "#F8FAFC", muted: "#1E293B" },
  neumorphism:  { primary: "#374151", secondary: "#6B7280", accent: "#F97316", background: "#E5E7EB", foreground: "#111827", muted: "#D1D5DB" },
  dark:         { primary: "#F8FAFC", secondary: "#CBD5E1", accent: "#22D3EE", background: "#0B1220", foreground: "#F8FAFC", muted: "#111827" },
  light:        { primary: "#0F172A", secondary: "#475569", accent: "#0EA5E9", background: "#FFFFFF", foreground: "#0F172A", muted: "#F1F5F9" },
  premium:      { primary: "#0B0B0B", secondary: "#4B4B4B", accent: "#D4AF37", background: "#0B0B0B", foreground: "#F5F5F4", muted: "#1C1917" },
  bold:         { primary: "#FFFFFF", secondary: "#F5F5F5", accent: "#F97316", background: "#DC2626", foreground: "#FFFFFF", muted: "#B91C1C" },
  luxury:       { primary: "#F5EAD1", secondary: "#C7A76C", accent: "#D4AF37", background: "#0A0908", foreground: "#F5EAD1", muted: "#1C1917" },
};

const DEFAULT_TYPOGRAPHY: DesignTypography = {
  heading:    { family: "Inter", weight: 800, size: 84 },
  subheading: { family: "Inter", weight: 600, size: 42 },
  body:       { family: "Inter", weight: 400, size: 28 },
  cta:        { family: "Inter", weight: 700, size: 32 },
};

export function paletteForStyle(style: DesignStyle, brand?: BrandKitSnapshot | null): DesignPalette {
  const base = FALLBACK_PALETTES[style];
  if (!brand) return base;
  return {
    ...base,
    primary: brand.primary || base.primary,
    secondary: brand.secondary || base.secondary,
    accent: brand.accent || base.accent,
  };
}

export function typographyForBrand(brand?: BrandKitSnapshot | null): DesignTypography {
  if (!brand) return DEFAULT_TYPOGRAPHY;
  const heading = brand.headingFont || DEFAULT_TYPOGRAPHY.heading.family;
  const body = brand.bodyFont || DEFAULT_TYPOGRAPHY.body.family;
  return {
    heading:    { ...DEFAULT_TYPOGRAPHY.heading, family: heading },
    subheading: { ...DEFAULT_TYPOGRAPHY.subheading, family: heading },
    body:       { ...DEFAULT_TYPOGRAPHY.body, family: body },
    cta:        { ...DEFAULT_TYPOGRAPHY.cta, family: heading },
  };
}

function el(partial: Omit<DesignElement, "id"> & { id?: string }): DesignElement {
  return { id: partial.id ?? crypto.randomUUID(), ...partial };
}

function scale(canvas: { width: number; height: number }, sx: number, sy: number, sw: number, sh: number) {
  return {
    x: Math.round(canvas.width * sx),
    y: Math.round(canvas.height * sy),
    width: Math.round(canvas.width * sw),
    height: Math.round(canvas.height * sh),
  };
}

/**
 * Build a canonical slide from copy + palette. This is the deterministic
 * fallback used when AI does not emit a full layout, and it also normalizes
 * AI output so the editor sees a predictable structure.
 */
export function buildSlide(
  index: number,
  canvas: { width: number; height: number },
  palette: DesignPalette,
  typography: DesignTypography,
  copy: DesignCopy,
  brand?: BrandKitSnapshot | null,
): DesignSlide {
  const elements: DesignElement[] = [];

  // Background accent bar
  elements.push(el({
    kind: "shape",
    ...scale(canvas, 0, 0, 1, 0.08),
    bgColor: palette.accent,
    z: 0,
  }));

  // Logo
  if (brand?.logoUrl) {
    elements.push(el({
      kind: "logo",
      role: "logo",
      ...scale(canvas, 0.05, 0.11, 0.16, 0.06),
      src: brand.logoUrl,
      z: 5,
    }));
  }

  // Headline
  elements.push(el({
    kind: "text",
    role: "headline",
    ...scale(canvas, 0.06, 0.24, 0.88, 0.22),
    content: copy.headline,
    color: palette.foreground,
    font: typography.heading,
    align: "left",
    z: 10,
  }));

  // Subheadline
  if (copy.subheadline) {
    elements.push(el({
      kind: "text",
      role: "subheadline",
      ...scale(canvas, 0.06, 0.48, 0.88, 0.12),
      content: copy.subheadline,
      color: palette.secondary,
      font: typography.subheading,
      align: "left",
      z: 10,
    }));
  }

  // Body
  if (copy.body) {
    elements.push(el({
      kind: "text",
      role: "body",
      ...scale(canvas, 0.06, 0.62, 0.88, 0.18),
      content: copy.body,
      color: palette.foreground,
      font: typography.body,
      align: "left",
      z: 10,
    }));
  }

  // CTA button
  if (copy.cta) {
    elements.push(el({
      kind: "cta",
      role: "cta",
      ...scale(canvas, 0.06, 0.83, 0.35, 0.08),
      content: copy.cta,
      color: palette.background,
      bgColor: palette.accent,
      font: typography.cta,
      align: "center",
      radius: 12,
      z: 20,
    }));
  }

  // QR placeholder
  elements.push(el({
    kind: "qr",
    role: "qr",
    ...scale(canvas, 0.85, 0.85, 0.1, 0.1),
    bgColor: palette.muted ?? "#F3F4F6",
    z: 20,
  }));

  // Footer / watermark
  if (copy.footer || brand?.watermarkUrl) {
    elements.push(el({
      kind: brand?.watermarkUrl ? "watermark" : "text",
      role: "footer",
      ...scale(canvas, 0.06, 0.94, 0.6, 0.04),
      content: copy.footer ?? "",
      src: brand?.watermarkUrl,
      color: palette.secondary,
      font: { ...typography.body, size: Math.round(typography.body.size * 0.7) },
      z: 20,
    }));
  }

  return {
    index,
    elements,
    background: { kind: "solid", value: palette.background },
  };
}

export function buildLayout(params: {
  format: DesignFormat;
  style: DesignStyle;
  copy: DesignCopy;
  palette: DesignPalette;
  typography: DesignTypography;
  brand?: BrandKitSnapshot | null;
  slidesCopy?: DesignCopy[];
}): DesignLayout {
  const spec = FORMAT_SPECS[params.format];
  const canvas = { width: spec.width, height: spec.height };
  const totalSlides = spec.slides ?? 1;

  const slides: DesignSlide[] = [];
  for (let i = 0; i < totalSlides; i++) {
    const copy = params.slidesCopy?.[i] ?? params.copy;
    slides.push(buildSlide(i, canvas, params.palette, params.typography, copy, params.brand));
  }

  return {
    format: params.format,
    style: params.style,
    canvas,
    slides,
    grid: { rows: 12, cols: 12 },
  };
}
