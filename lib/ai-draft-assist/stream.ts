// lib/ai-draft-assist/stream.ts
// Client-side streaming fetch for AI draft generation.
// Consumes SSE from /api/ai/stream-draft and calls onToken for each chunk.

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (message?: string) => void;
}

/**
 * Stream AI draft generation from the server.
 * Returns an AbortController so the caller can cancel.
 */
export function streamDraftAssist(
  bullets: string[],
  locale: "EN" | "AR",
  tone: string,
  callbacks: StreamCallbacks,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch("/api/ai/stream-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets, locale, tone }),
        signal: controller.signal,
      });

      if (!response.ok) {
        callbacks.onError();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            callbacks.onDone(accumulated);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              callbacks.onError(parsed.message);
              return;
            }
            if (parsed.text) {
              accumulated += parsed.text;
              callbacks.onToken(parsed.text);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      callbacks.onDone(accumulated);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return; // User cancelled — no error
      }
      callbacks.onError();
    }
  })();

  return controller;
}
