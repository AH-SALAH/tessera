// components/admin/ContentForm.tsx
// Reusable admin form (Constitution Article VIII) — used for Project authoring here; Post
// and Testimonial forms (tasks.md, not scaffolded in this download) compose the same pattern
// rather than duplicating the RHF+Zod+AntD wiring.

"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, Input, Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AiDraftAssistModal, type AiDraftContent } from "./AiDraftAssistModal";
import { IconAiAssist } from "@/components/ui/icons";
import type { DraftTone } from "@/lib/ai-draft-assist/client";

import { projectInputSchema } from "@/lib/validation/project";

// Client UX variant: the stack field is a comma-separated string in the form
// (converted with splitStack/joinStack before hitting GraphQL). Every other
// rule comes from the shared Article V schema — no duplicated validation.
const projectSchema = projectInputSchema.extend({
  stack: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ContentFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onPublish?: () => Promise<void>;
  canPublish: boolean; // FR-008: server enforces this regardless; UI reflects it honestly
  aiDraftAssistEnabled: boolean; // FR-010: control is absent, not disabled, when flag is off
  onGenerateDraftAssist?: (
    bullets: string[],
    tone: DraftTone,
  ) => Promise<{ description?: string; descriptionAr?: string; seoSummary?: string }>;
}

export function ContentForm({
  defaultValues,
  onSubmit,
  onPublish,
  canPublish,
  aiDraftAssistEnabled,
  onGenerateDraftAssist,
}: ContentFormProps) {
  const { t } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState<AiDraftContent | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  async function handleGenerate(bullets: string[], tone: DraftTone) {
    if (!onGenerateDraftAssist) return;
    setAiLoading(true);
    setAiContent(null);
    try {
      const result = await onGenerateDraftAssist(bullets, tone);
      setAiContent(result);
    } finally {
      setAiLoading(false);
    }
  }

  function handleApplyAiContent(content: AiDraftContent) {
    if (content.description) setValue("descriptionEn", content.description);
    if (content.descriptionAr) setValue("descriptionAr", content.descriptionAr);
    setAiModalOpen(false);
    setAiContent(null);
  }

  function handleCancelAi() {
    setAiModalOpen(false);
    setAiContent(null);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(onSubmit)(e);
      }}
    >
      {/* component={false}: antd must not render a nested <form> element —
          nested forms are invalid HTML and break submit-button association. */}
      <Form layout="vertical" component={false}>
        <Form.Item label={t("content.slug")} required>
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="my-project"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            )}
          />
        </Form.Item>

        <Form.Item label={t("content.titleEn")} required>
          <Controller
            name="titleEn"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label={t("content.titleAr")}>
          <Controller
            name="titleAr"
            control={control}
            render={({ field }) => <Input {...field} dir="rtl" />}
          />
        </Form.Item>
        <Form.Item label={t("content.descriptionEn")} required>
          <Controller
            name="descriptionEn"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={3} />}
          />
        </Form.Item>
        <Form.Item label={t("content.descriptionAr")}>
          <Controller
            name="descriptionAr"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={3} dir="rtl" />}
          />
        </Form.Item>

        <Form.Item label={t("content.stack")}>
          <Controller
            name="stack"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="React, TypeScript, Next.js"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            )}
          />
        </Form.Item>

        <Form.Item label={t("content.liveUrl")}>
          <Controller
            name="liveUrl"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="https://example.com"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            )}
          />
        </Form.Item>
      </Form>

      {aiDraftAssistEnabled && (
        <Button
          htmlType="button"
          type="dashed"
          onClick={() => setAiModalOpen(true)}
          icon={<IconAiAssist />}
          className="mb-4"
        >
          {t("aiDraftAssist.cta")}
        </Button>
      )}

      <AiDraftAssistModal
        open={aiModalOpen}
        loading={aiLoading}
        content={aiContent}
        onGenerate={handleGenerate}
        onApply={handleApplyAiContent}
        onCancel={handleCancelAi}
      />

      <div className="flex gap-2">
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          {t("content.addNew")}
        </Button>

        {/* Publish stays visible for Editors — disabled with an explanatory tooltip rather
            than hidden, matching PulseFeed's "never hide the control" accessibility pattern.
            Span wrapper required: disabled buttons swallow pointer events, so the Tooltip
            must attach to the wrapper. */}
        <Tooltip title={!canPublish ? t("content.publishAdminOnly") : undefined}>
          <span>
            <Button disabled={!canPublish} onClick={onPublish}>
              {t("content.publish")}
            </Button>
          </span>
        </Tooltip>
      </div>
    </form>
  );
}
