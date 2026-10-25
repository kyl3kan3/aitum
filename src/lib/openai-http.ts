/**
 * OpenAI HTTP client. Prefer EXPO_PUBLIC_VIBECODE_AI_PROXY_URL so API keys are not shipped in the app bundle.
 */

export type OpenAIResponsesBody = Record<string, unknown>;

export function isOpenAIConfigured(): boolean {
  return !!(
    process.env.EXPO_PUBLIC_VIBECODE_AI_PROXY_URL?.trim() ||
    process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY?.trim()
  );
}

export async function postOpenAIResponses(body: OpenAIResponsesBody): Promise<Response> {
  const proxyBase = process.env.EXPO_PUBLIC_VIBECODE_AI_PROXY_URL?.replace(/\/$/, "");
  if (proxyBase) {
    return fetch(`${proxyBase}/openai/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI not configured: set EXPO_PUBLIC_VIBECODE_AI_PROXY_URL (recommended) or EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY in the Vibecode ENV tab.",
    );
  }

  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}
