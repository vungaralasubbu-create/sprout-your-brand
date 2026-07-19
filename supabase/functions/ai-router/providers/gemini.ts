import { getSecret } from "../config.ts";
import type { AIProvider } from "../types.ts";

export const geminiProvider: AIProvider = {
  id: "gemini",
  isConfigured() {
    return Boolean(getSecret("GEMINI_API_KEY"));
  },
  async execute({ task, model, prompt }) {
    await Promise.resolve();
    return {
      model: model ?? "gemini-2.5-flash",
      data: {
        placeholder: true,
        provider: "gemini",
        task,
        preview: prompt.slice(0, 64),
      },
    };
  },
};
