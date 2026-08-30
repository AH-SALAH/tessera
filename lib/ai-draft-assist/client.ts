// lib/ai-draft-assist/client.ts
// Same OpenRouter integration pattern as PulseFeed's ai-insight module: OpenAI-compatible
// SDK call, model ID kept in an env var (free-model IDs rotate — check openrouter.ai/models
// before each deploy), typed { available: false } result on any failure rather than throwing,
// so a provider hiccup never blocks the authoring form (FR-011).

export type DraftTone = "academic" | "curatorial" | "exhibition";

interface DraftAssistResult {
  available: boolean;
  description?: string;
  seoSummary?: string;
  resetsAt?: string;
}

const TONE_INSTRUCTIONS: Record<DraftTone, string> = {
  academic:
    "Write in formal academic prose with discipline-appropriate terminology. " +
    "Assume the reader has subject-matter expertise.",
  curatorial:
    "Write as a museum curator summarizing an accessioned piece for an internal catalog. " +
    "Be precise and factual, emphasizing provenance and classification.",
  exhibition:
    "Write for a general museum-going audience. Accessible, engaging, and jargon-free. " +
    "Convey significance without assuming prior knowledge.",
};

export async function generateDraftAssist(
  bullets: string[],
  locale: "EN" | "AR",
  tone: DraftTone = "curatorial",
): Promise<DraftAssistResult> {
  try {
    const languageInstruction =
      locale === "AR" ? "Write the response in Arabic." : "Write the response in English.";

    const toneInstruction = TONE_INSTRUCTIONS[tone];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
        messages: [
          {
            role: "user",
            content:
              `${languageInstruction} ${toneInstruction} From these bullet points, ` +
              `write (1) a 2-3 sentence project description and (2) a one-sentence SEO summary. ` +
              `Bullets:\n` +
              bullets.map((b) => `- ${b}`).join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return { available: false, resetsAt: nextUtcMidnight() };
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const [description, seoSummary] = text.split(/\n+/).filter(Boolean);

    return { available: true, description, seoSummary };
  } catch {
    return { available: false, resetsAt: nextUtcMidnight() };
  }
}

function nextUtcMidnight(): string {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return midnight.toISOString();
}
