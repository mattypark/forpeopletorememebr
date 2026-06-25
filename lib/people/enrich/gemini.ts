import "server-only";

/**
 * Minimal Gemini REST client with model fallback on rate-limit / not-found,
 * forced JSON output. Returns parsed JSON or null — never throws.
 * Mirrors the data-scraper-agent fallback chain, ported to TypeScript.
 */

const MODEL_FALLBACK = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
];

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

function extractText(json: unknown): string {
  const candidates = (json as { candidates?: GeminiCandidate[] }).candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

export async function generateJson<T>(prompt: string): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  for (const model of MODEL_FALLBACK) {
    try {
      const resp = await fetch(
        `${ENDPOINT}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (resp.status === 429 || resp.status === 404) continue;
      if (!resp.ok) return null;

      const text = extractText(await resp.json());
      if (!text) return null;
      return JSON.parse(text) as T;
    } catch {
      // try next model
    }
  }
  return null;
}
