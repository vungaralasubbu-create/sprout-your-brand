/**
 * Provider registry — add a new provider by importing it here.
 * All consumers call getProvider(code) so the rest of the codebase stays adapter-free.
 */
import type { PaymentProvider, ProviderCode } from "./types";
import { cashfree } from "./cashfree.server";

const providers: Record<string, PaymentProvider> = {
  cashfree,
  // stripe: (future) — implement PaymentProvider and register here.
  // paddle: ...
  // razorpay: ...
  // lemonsqueezy: ...
};

export function getProvider(code: ProviderCode): PaymentProvider {
  const p = providers[code];
  if (!p) throw new Error(`Unknown payment provider: ${code}`);
  return p;
}

export function listEnabledProviders(): PaymentProvider[] {
  return Object.values(providers).filter((p) => p.isEnabled());
}

export function defaultProvider(): PaymentProvider {
  return listEnabledProviders()[0] ?? cashfree;
}
