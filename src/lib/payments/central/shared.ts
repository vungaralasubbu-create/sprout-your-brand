// Central payment system — shared helpers and zod schemas.
import { z } from "zod";

export const PAYMENT_STATUSES = [
  "pending",
  "submitted",
  "verified",
  "rejected",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const enrollmentFormSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{7,20}$/i, "Invalid phone number")
    .max(20),
  college: z.string().trim().max(200).optional().nullable(),
  degree: z.string().trim().max(120).optional().nullable(),
  graduationYear: z
    .number()
    .int()
    .min(1970)
    .max(2100)
    .optional()
    .nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  couponCode: z.string().trim().max(60).optional().nullable(),
  referralCode: z.string().trim().max(60).optional().nullable(),
});
export type EnrollmentFormInput = z.infer<typeof enrollmentFormSchema>;

export const utrSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{6,40}$/, "UTR must be 6-40 alphanumeric characters");

export function generateOrderId(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GLR-${y}${m}${d}-${rand}`;
}

/** Compute the amount to charge for a given course row (base/offer). */
export function resolveCourseAmount(course: {
  offer_price?: number | null;
  base_price?: number | null;
  self_paced_price?: number | null;
}): number {
  const candidates = [
    course.offer_price,
    course.base_price,
    course.self_paced_price,
  ]
    .map((n) => (typeof n === "number" ? n : Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return candidates.length ? Number(candidates[0]) : 0;
}
