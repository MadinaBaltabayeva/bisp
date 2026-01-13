import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | null };

function createOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const openai = globalForOpenAI.openai ?? createOpenAIClient();

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

export function isAIEnabled(): boolean {
  return openai !== null;
}
