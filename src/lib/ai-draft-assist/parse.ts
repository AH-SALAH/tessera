// lib/ai-draft-assist/parse.ts
// Parses the streamed AI output into structured fields.
// The server prompt asks the LLM to output description, then "SEO: " + summary.

const SEO_MARKER = /(?:\n|\r\n|\r|^)\s*SEO:\s*/i;

export interface ParsedDraft {
  description: string;
  seoSummary: string;
}

/**
 * Split raw streamed text into description + seoSummary.
 * The LLM is prompted to write description, then `SEO: <summary>` on a new line.
 */
export function parseStreamOutput(rawText: string): ParsedDraft {
  const match = rawText.match(SEO_MARKER);
  if (!match || match.index === undefined) {
    return { description: rawText.trim(), seoSummary: "" };
  }
  const description = rawText.slice(0, match.index).trim();
  const seoSummary = rawText.slice(match.index + match[0].length).trim();
  return { description, seoSummary };
}
