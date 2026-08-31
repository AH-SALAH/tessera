// components/admin/AiDraftAssistModal.tsx
// Two-panel modal: left sidebar for input (bullets + tone), right panel for output.
// Streaming: skeleton shimmer → typewriter effect → editable text.
// Human-in-the-loop (FR-011): AI text is editable before applying to form.

"use client";

import { Modal, Input, Select, Button, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useState, useRef, useCallback, useEffect } from "react";
import type { DraftTone } from "@/lib/ai-draft-assist/client";
import { parseStreamOutput } from "@/lib/ai-draft-assist/parse";
import { IconAiAssist } from "@/components/ui/icons";

const { TextArea } = Input;
const { Text } = Typography;

export interface AiDraftContent {
  description?: string;
  descriptionAr?: string;
  seoSummary?: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (message?: string) => void;
}

interface AiDraftAssistModalProps {
  open: boolean;
  content: AiDraftContent | null;
  onStreamGenerate: (
    bullets: string[],
    tone: DraftTone,
    callbacks: StreamCallbacks,
  ) => AbortController;
  onApply: (content: AiDraftContent) => void;
  onCancel: () => void;
}

const TONE_OPTIONS: { value: DraftTone; labelKey: string }[] = [
  { value: "ACADEMIC", labelKey: "aiDraftAssist.tone.academic" },
  { value: "CURATORIAL", labelKey: "aiDraftAssist.tone.curatorial" },
  { value: "EXHIBITION", labelKey: "aiDraftAssist.tone.exhibition" },
];

export function AiDraftAssistModal({
  open,
  content,
  onStreamGenerate,
  onApply,
  onCancel,
}: AiDraftAssistModalProps) {
  const { t } = useTranslation();
  const [bullets, setBullets] = useState("");
  const [tone, setTone] = useState<DraftTone>("CURATORIAL");

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingSeo, setStreamingSeo] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Error state for moderation/filtering
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Typewriter effect — character-based draining via rAF with batched state
  const [displayText, setDisplayText] = useState("");
  const charBufferRef = useRef("");      // raw chars from stream
  const renderedRef = useRef("");        // chars already flushed to displayText
  const rafRef = useRef<number>(0);
  const isStreamingRef = useRef(false);
  const pendingFullTextRef = useRef<string | null>(null);
  const CHARS_PER_FRAME = 5;
  const FLUSH_EVERY = 2;       // sync to React state every N frames

  // User edits override the streamed content
  const [userDescription, setUserDescription] = useState<string | null>(null);
  const [userSeoSummary, setUserSeoSummary] = useState<string | null>(null);

  // Derived display values
  const description = userDescription ?? streamingText ?? content?.description ?? "";
  const seoSummary = userSeoSummary ?? streamingSeo ?? content?.seoSummary ?? "";

  // Sync isStreaming to ref for rAF closure
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reset streaming state when modal closes — imperative cleanup only (no setState in effect)
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      abortRef.current?.abort();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      charBufferRef.current = "";
      renderedRef.current = "";
      pendingFullTextRef.current = null;
    }
    prevOpenRef.current = open;
  }, [open]);

  // Accumulate incoming token into char buffer
  function enqueueToken(token: string) {
    charBufferRef.current += token;
  }

  // Drain chars from buffer into renderedRef, batch-sync to displayText
  const frameCountRef = useRef(0);
  const flushChars = useCallback(() => {
    const buf = charBufferRef.current;
    if (buf.length === 0) return;
    const take = Math.min(CHARS_PER_FRAME, buf.length);
    charBufferRef.current = buf.slice(take);
    renderedRef.current += buf.slice(0, take);
    // Batch state updates: only sync to React state every N frames
    frameCountRef.current++;
    if (frameCountRef.current % FLUSH_EVERY === 0 || charBufferRef.current.length === 0) {
      setDisplayText(renderedRef.current);
    }
  }, [])

  // Flush all remaining buffer content immediately
  function flushAllRemaining() {
    const remaining = charBufferRef.current;
    charBufferRef.current = "";
    if (remaining) {
      renderedRef.current += remaining;
      setDisplayText(renderedRef.current);
    }
    return remaining;
  }

  // Typewriter consumer — drains char buffer via rAF
  function startTyping() {
    if (rafRef.current) return;
    frameCountRef.current = 0;
    const tick = () => {
      flushChars();
      const bufferEmpty = charBufferRef.current.length === 0;
      if (isStreamingRef.current || !bufferEmpty) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Stream done AND buffer fully drained — finalize
        rafRef.current = 0;
        if (pendingFullTextRef.current) {
          const fullText = pendingFullTextRef.current;
          pendingFullTextRef.current = null;
          const parsed = parseStreamOutput(fullText);
          setDisplayText(parsed.description);
          setStreamingText(parsed.description);
          setStreamingSeo(parsed.seoSummary);
          setIsStreaming(false);
          abortRef.current = null;
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopTyping() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const remaining = flushAllRemaining();
    if (remaining) {
      setDisplayText((prev) => prev + remaining);
    }
  }

  function handleGenerate() {
    const bulletLines = bullets
      .split("\n")
      .map((l) => l.replace(/^-\\s*/, "").trim())
      .filter(Boolean);
    if (bulletLines.length === 0) return;

    // Cancel any in-progress stream
    abortRef.current?.abort();
    stopTyping();

    // Clear state
    setUserDescription(null);
    setUserSeoSummary(null);
    setStreamingText("");
    setDisplayText("");
    setErrorMessage(null);
    charBufferRef.current = "";
    renderedRef.current = "";
    pendingFullTextRef.current = null;
    isStreamingRef.current = true;
    setIsStreaming(true);
    startTyping();

    const controller = onStreamGenerate(bulletLines, tone, {
      onToken(token) {
        enqueueToken(token);
      },
      onDone(fullText) {
        isStreamingRef.current = false;
        pendingFullTextRef.current = fullText;
      },
      onError(message) {
        setIsStreaming(false);
        stopTyping();
        setStreamingText("");
        setDisplayText("");
        setStreamingSeo("");
        setErrorMessage(message ?? "Generation failed. Please try again.");
        abortRef.current = null;
      },
    });

    abortRef.current = controller;
  }

  function handleCancel() {
    abortRef.current?.abort();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    charBufferRef.current = "";
    renderedRef.current = "";
    pendingFullTextRef.current = null;
    setIsStreaming(false);
    setStreamingText("");
    setDisplayText("");
    setStreamingSeo("");
    setErrorMessage(null);
    onCancel();
  }

  function handleApply() {
    onApply({ description, seoSummary });
  }

  const isGenerating = isStreaming;
  const hasContent = isStreaming || streamingText || content;

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      width={960}
      className="!p-0"
      footer={null}
      classNames={{ body: "p-0" }}
    >
      <div className="flex flex-col sm:flex-row max-h-[870px] overflow-hidden">
        {/* Left sidebar — Input */}
        <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-[var(--color-clay-line)] bg-[var(--color-chalk)] p-6 flex flex-col flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <IconAiAssist className="text-[var(--color-ochre)] text-lg" />
            <h2 className="text-lg font-semibold text-[var(--color-moss)] font-[var(--font-display)]">
              {t("aiDraftAssist.modal.title")}
            </h2>
          </div>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
            <div>
              <label
                htmlFor="ai-bullets"
                className="block text-xs font-medium tracking-wider uppercase text-[var(--color-muted)] mb-2"
              >
                {t("aiDraftAssist.input.bullets")}
              </label>
              <TextArea
                id="ai-bullets"
                name="ai-bullets"
                rows={8}
                value={bullets}
                onChange={(e) => setBullets(e.target.value)}
                placeholder={t("aiDraftAssist.input.bulletsPlaceholder")}
                className="!placeholder-[var(--color-on-surface-variant)] !border-[var(--color-clay-line)] !bg-[var(--color-surface)] !rounded focus:!border-[var(--color-ochre)] focus:!ring-1 focus:!ring-[var(--color-ochre)]"
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>

            <div>
              <label
                htmlFor="ai-tone"
                className="block text-xs font-medium tracking-wider uppercase text-[var(--color-muted)] mb-2"
              >
                {t("aiDraftAssist.input.tone")}
              </label>
              <Select
                id="ai-tone"
                value={tone}
                onChange={(val) => setTone(val)}
                options={TONE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(opt.labelKey),
                }))}
                className="w-full"
                popupMatchSelectWidth={false}
              />
            </div>

            <div className="mt-auto pt-4">
              <Button
                type="primary"
                block
                onClick={handleGenerate}
                disabled={isGenerating || !bullets.trim()}
                className="!bg-[var(--color-moss)] !border-[var(--color-moss)] hover:!opacity-90 disabled:!text-[var(--color-chalk)] bottom-2"
              >
                {isGenerating
                  ? t("aiDraftAssist.loading")
                  : t("aiDraftAssist.cta")}
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — Output */}
        <div className="flex-1 bg-[var(--color-surface)] p-6 flex flex-col relative overflow-hidden">
          {/* Header / Metadata */}
          <div className="flex justify-between items-start mb-6 border-b border-[var(--color-clay-line)] pb-4">
            <div>
              <div
                className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--color-muted)] mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("aiDraftAssist.output.reqId")}
              </div>
              <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {t("aiDraftAssist.output.draftTitle")}
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-[var(--color-ochre)]/10 px-3 py-1 rounded-xl border border-[var(--color-ochre)]/20">
              <span className="w-2 h-2 rounded-full bg-[var(--color-ochre)] animate-pulse" />
              <span
                className="text-xs font-medium text-[var(--color-ochre)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {isGenerating
                  ? t("aiDraftAssist.output.statusGenerating")
                  : content || streamingText
                    ? t("aiDraftAssist.output.statusReady")
                    : t("aiDraftAssist.output.statusPending")}
              </span>
            </div>
          </div>

          {/* Content Canvas */}
          <div className="flex-1 overflow-y-auto relative p-4 h-64 max-h-64">
            {/* Phase 1: Skeleton shimmer — before first token */}
            {isGenerating && !displayText && (
              <div className="max-w-2xl mx-auto space-y-4 mt-4">
                {[100, 83, 100, 80, 0, 100, 75].map((w, i) =>
                  w === 0 ? (
                    <br key={i} />
                  ) : (
                    <div
                      key={i}
                      className="h-4 rounded"
                      style={{
                        width: `${w}%`,
                        background: `linear-gradient(90deg, var(--color-clay-line) 25%, var(--color-surface) 50%, var(--color-clay-line) 75%)`,
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s ease-in-out infinite"
                      }}
                    />
                  ),
                )}
              </div>
            )}

            {/* Phase 2: Typewriter — streaming tokens arrive */}
            {isGenerating && displayText && (
              <div className="max-w-2xl mx-auto mt-4">
                <div className="relative">
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "var(--font-body)", color: "var(--color-graphite-text)" }}
                  >
                    {displayText}
                    <span
                      className="inline-block w-[2px] h-[1em] ml-[1px] align-text-bottom"
                      style={{
                        backgroundColor: "var(--color-ochre)",
                        animation: "blink 1s ease-in-out infinite"
                      }}
                    />
                  </p>
                </div>
              </div>
            )}

            {/* Error state — moderation/filtering */}
            {errorMessage && !isGenerating && (
              <div className="max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
                <div className="flex items-start gap-3">
                  <span className="text-[var(--color-error)] text-lg flex-shrink-0 mt-0.5" role="img" aria-label="Error">⚠</span>
                  <div className="text-sm text-[var(--color-error)]" style={{ fontFamily: "var(--font-body)" }}>
                    <p className="font-medium mb-1">{t("aiDraftAssist.error.title")}</p>
                    <p>{errorMessage}</p>
                    <p className="mt-2 text-xs opacity-80">{t("aiDraftAssist.error.retryHint")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 3: Final content — editable */}
            {!isGenerating && (streamingText || content) && (
              <div className="max-w-2xl mx-auto space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="ai-description"
                    className="block text-xs font-medium tracking-wider uppercase text-[var(--color-muted)] mb-2"
                  >
                    {t("content.descriptionEn")}
                  </label>
                  <TextArea
                    id="ai-description"
                    name="ai-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setUserDescription(e.target.value)}
                    className="!border-[var(--color-clay-line)] !rounded"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>
                {seoSummary && (
                  <div>
                    <label
                      htmlFor="ai-seo"
                      className="block text-xs font-medium tracking-wider uppercase text-[var(--color-muted)] mb-2"
                    >
                      {t("aiDraftAssist.modal.seoSummary")}
                    </label>
                    <TextArea
                      id="ai-seo"
                      name="ai-seo"
                      rows={2}
                      value={seoSummary}
                      onChange={(e) => setUserSeoSummary(e.target.value)}
                      className="!border-[var(--color-clay-line)] !rounded"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && !streamingText && !content && !errorMessage && (
              <div className="flex items-center justify-center h-full text-[var(--color-muted)] text-sm">
                {t("aiDraftAssist.output.emptyState")}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[var(--color-clay-line)] flex justify-end gap-4">
            <Button
              onClick={handleCancel}
              className="!border-[var(--color-clay-line)] !text-[var(--color-graphite)]"
            >
              {t("aiDraftAssist.modal.cancel")}
            </Button>
            <Button
              type="primary"
              onClick={handleApply}
              disabled={isGenerating || (!streamingText && !content)}
              className="!bg-[var(--color-moss)] !border-[var(--color-moss)] disabled:!text-[var(--color-chalk)]"
            >
              {t("aiDraftAssist.modal.apply")}
            </Button>
          </div>
        </div>
      </div>


    </Modal>
  );
}
