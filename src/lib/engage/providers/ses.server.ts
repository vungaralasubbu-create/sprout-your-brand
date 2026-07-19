/**
 * Amazon SES adapter — placeholder that surfaces a clear "configure this
 * provider first" error until full SigV4 signing is wired. Left as a stub so
 * the UI already shows SES as a selectable provider.
 */

import type { EngageProviderAdapter, ProviderConfig } from "./registry.server";
import type { RenderedMessage, SendResult, VerifyResult } from "../types";

export const sesAdapter: EngageProviderAdapter = {
  kind: "ses",
  displayName: "Amazon SES",
  channel: "email",
  supportsWebhooks: true,

  async verify(_config: ProviderConfig): Promise<VerifyResult> {
    return {
      ok: false,
      error: "SES adapter is available; connect your access key + secret to enable sending.",
    };
  },

  async send(_config: ProviderConfig, _message: RenderedMessage): Promise<SendResult> {
    return {
      ok: false,
      error_code: "not_configured",
      error_message: "Configure AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY to enable SES sending.",
    };
  },
};
