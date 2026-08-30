// components/admin/AiDraftAssistModal.tsx
// Two-panel modal matching Stitch screen: left sidebar for input (bullets + tone),
// right panel for output (draft content with skeleton loading).
// Human-in-the-loop (FR-011): AI text is editable before applying to form.

"use client";

import { Modal, Input, Select, Button, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { DraftTone } from "@/lib/ai-draft-assist/client";
import { IconAiAssist } from "@/components/ui/icons";

const { TextArea } = Input;
const { Text } = Typography;

export interface AiDraftContent {
  description?: string;
  descriptionAr?: string;
  seoSummary?: string;
}

interface AiDraftAssistModalProps {
  open: boolean;
  loading: boolean;
  content: AiDraftContent | null;
  onGenerate: (bullets: string[], tone: DraftTone) => void;
  onApply: (content: AiDraftContent) => void;
  onCancel: () => void;
}

const TONE_OPTIONS: { value: DraftTone; labelKey: string }[] = [
  { value: "academic", labelKey: "aiDraftAssist.tone.academic" },
  { value: "curatorial", labelKey: "aiDraftAssist.tone.curatorial" },
  { value: "exhibition", labelKey: "aiDraftAssist.tone.exhibition" },
];

export function AiDraftAssistModal({
  open,
  loading,
  content,
  onGenerate,
  onApply,
  onCancel,
}: AiDraftAssistModalProps) {
  const { t } = useTranslation();
  const [bullets, setBullets] = useState("");
  const [tone, setTone] = useState<DraftTone>("curatorial");
  const [description, setDescription] = useState("");
  const [seoSummary, setSeoSummary] = useState("");

  function handleGenerate() {
    const bulletLines = bullets
      .split("\n")
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);
    if (bulletLines.length > 0) {
      onGenerate(bulletLines, tone);
      // Sync description from content after generation starts
      if (content) {
        setDescription(content.description ?? "");
        setSeoSummary(content.seoSummary ?? "");
      }
    }
  }

  function handleApply() {
    onApply({ description, seoSummary });
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={960}
      className="!p-0"
      footer={null}
      styles={{ body: { padding: 0 } }}
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
                disabled={loading || !bullets.trim()}
                className="!bg-[var(--color-moss)] !border-[var(--color-moss)] hover:!opacity-90 disabled:!text-[var(--color-muted)]"
              >
                {loading ? t("aiDraftAssist.loading") : t("aiDraftAssist.cta")}
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
                {loading
                  ? t("aiDraftAssist.output.statusGenerating")
                  : content
                    ? t("aiDraftAssist.output.statusReady")
                    : t("aiDraftAssist.output.statusPending")}
              </span>
            </div>
          </div>

          {/* Content Canvas */}
          <div className="flex-1 overflow-y-auto relative p-4">
            {loading && !content && (
              <div className="max-w-2xl mx-auto space-y-4 mt-4">
                {[100, 83, 100, 80, 0, 100, 75].map((w, i) =>
                  w === 0 ? (
                    <br key={i} />
                  ) : (
                    <div
                      key={i}
                      className="h-4 bg-[var(--color-surface-container-high)] rounded animate-pulse"
                      style={{ width: `${w}%` }}
                    />
                  ),
                )}
              </div>
            )}

            {content && (
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
                    value={content.description ?? ""}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="!border-[var(--color-clay-line)] !rounded"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>
                {content.seoSummary && (
                  <div>
                    <label className="block text-xs font-medium tracking-wider uppercase text-[var(--color-muted)] mb-2">
                      {t("aiDraftAssist.modal.seoSummary")}
                    </label>
                    <Text className="text-sm text-[var(--color-muted)]">{content.seoSummary}</Text>
                  </div>
                )}
              </div>
            )}

            {!loading && !content && (
              <div className="flex items-center justify-center h-full text-[var(--color-muted)] text-sm">
                {t("aiDraftAssist.output.emptyState")}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[var(--color-clay-line)] flex justify-end gap-4">
            <Button
              onClick={onCancel}
              className="!border-[var(--color-clay-line)] !text-[var(--color-graphite)]"
            >
              {t("aiDraftAssist.modal.cancel")}
            </Button>
            <Button
              type="primary"
              onClick={handleApply}
              disabled={loading || !content}
              className="!bg-[var(--color-moss)] !border-[var(--color-moss)] disabled:!text-[var(--color-muted)]"
            >
              {t("aiDraftAssist.modal.apply")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
