import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

export const openAiProvider: AIProvider = {
  id: "openai",
  isConfigured() {
    return Boolean(getSecret("OPENAI_API_KEY"));
  },
  async execute({ task, model, prompt }) {
    // Placeholder — real chat/completions call will be wired in a future prompt.
    // Uses withRetry + withTimeout from helpers/retry.ts when implemented.
    await Promise.resolve();
    return {
      model: model ?? "gpt-4o-mini",
      data: {
        placeholder: true,
        provider: "openai",
        task,
        preview: prompt.slice(0, 64),
      },
    };
  },
};
