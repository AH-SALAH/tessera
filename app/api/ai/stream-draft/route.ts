// app/api/ai/stream-draft/route.ts
// Server-Sent Events endpoint for streaming AI draft generation.
// Proxies OpenRouter's streaming API to the client via ReadableStream.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { isEnabled } from "@/lib/feature-flags";

const SYSTEM_ROLE =
  "You are a senior content writer. Given raw notes, synthesize them into a polished 2-3 sentence description. " +
  "Never rephrase or re-list source points — weave into natural prose."

const TONE_INSTRUCTIONS: Record<string, string> = {
  ACADEMIC: "Formal academic prose, discipline-appropriate terminology.",
  CURATORIAL: "Curatorial — precise, factual, emphasizing provenance and classification.",
  EXHIBITION: "Public-facing — accessible, jargon-free, engaging.",
};

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getServerSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Feature flag check
  const enabled = await isEnabled("AI_DRAFT_ASSIST");
  if (!enabled) {
    return NextResponse.json({ error: "FEATURE_DISABLED" }, { status: 403 });
  }

  const body = await request.json();
  const { bullets, locale, tone = "CURATORIAL" } = body as {
    bullets: string[];
    locale: "EN" | "AR";
    tone?: string;
  };

  if (!bullets?.length) {
    return NextResponse.json({ error: "bullets required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
  }

  const languageInstruction =
    locale === "AR" ? "Write the response in Arabic." : "Write the response in English.";

  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.CURATORIAL;

  const prompt =
    `${languageInstruction} ${toneInstruction}\n\n` +
    `After the description, on a NEW LINE write SEO: followed by a one-sentence search summary.\n\n` +
    `Notes:\n` +
    bullets.map((b) => `- ${b}`).join("\n");

  const encoder = new TextEncoder();

  // Moderation phrases that indicate a safety/filter response, not real content
  const MODERATION_PATTERNS = [
    /^user\s+safety/i,
    /^safety\s*:/i,
    /^content\s+filter/i,
    /^moderation/i,
    /^this\s+content\s+(?:was\s+)?flagged/i,
    /^i\s+(?:cannot|can't)\s+(?:generate|provide)/i,
    /^as\s+an\s+ai/i,
  ];

  function isModerationResponse(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return MODERATION_PATTERNS.some((p) => p.test(normalized));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_ROLE },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let hasStreamedContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedContent += content;
                // Only stream if we haven't detected moderation yet
                if (!isModerationResponse(accumulatedContent)) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                  hasStreamedContent = true;
                }
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data !== "[DONE]") {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  accumulatedContent += content;
                  if (!isModerationResponse(accumulatedContent)) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                    hasStreamedContent = true;
                  }
                }
              } catch {
                // Skip
              }
            }
          }
        }

        // If moderation detected or no valid content streamed, send error
        if (!hasStreamedContent || isModerationResponse(accumulatedContent)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: true,
                message: "Content filtered by safety system. Please rephrase your notes.",
              })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
