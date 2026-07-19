import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

export const anthropicProvider: AIProvider = {
  id: "anthropic",
  isConfigured() {
    return Boolean(getSecret("ANTHROPIC_API_KEY"));
  },
  async execute({ task, model, prompt }) {
    await Promise.resolve();
    return {
      model: model ?? "claude-3-5-sonnet-latest",
      data: {
        placeholder: true,
        provider: "anthropic",
        task,
        preview: prompt.slice(0, 64),
      },
    };
  },
};
