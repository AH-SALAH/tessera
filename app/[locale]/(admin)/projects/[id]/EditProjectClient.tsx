// app/[locale]/(admin)/projects/[id]/EditProjectClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { App } from "antd";
import { joinStack, splitStack } from "@/lib/validation/project";
import { useTranslation } from "react-i18next";
import { apolloClient } from "@/lib/apollo/client";
import { useAdminFlags } from "../../admin-flags";
import type { DraftTone } from "@/lib/ai-draft-assist/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { projectInputSchema } from "@/lib/validation/project";
import { useState, useCallback, useRef } from "react";
import { AiDraftAssistModal, type AiDraftContent } from "@/components/admin/AiDraftAssistModal";
import Link from "next/link";
import {
  IconChevronRight,
  IconPublished,
  IconUpload,
  IconSave,
  IconAiAssist,
} from "@/components/ui/icons";

const projectSchema = projectInputSchema.extend({
  stack: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const UPDATE_PROJECT: TypedDocumentNode<UpdateProjectData> = gql`
  mutation UpdateProject($id: ID!, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      slug
    }
  }
`;

const GENERATE_DRAFT_ASSIST: TypedDocumentNode<DraftAssistData> = gql`
  mutation GenerateDraftAssist($bullets: [String!]!, $locale: Locale!, $tone: DraftTone!) {
    generateDraftAssist(bullets: $bullets, locale: $locale, tone: $tone) {
      available
      description
      seoSummary
    }
  }
`;

const PUBLISH_PROJECT: TypedDocumentNode<PublishProjectData> = gql`
  mutation PublishProject($id: ID!) {
    publishProject(id: $id) {
      id
      status
    }
  }
`;

interface UpdateProjectData {
  updateProject: {
    id: string;
    slug: string;
  };
}

interface PublishProjectData {
  publishProject: {
    id: string;
    status: "DRAFT" | "PUBLISHED";
  };
}

interface DraftAssistData {
  generateDraftAssist: {
    available: boolean;
    description?: string;
    seoSummary?: string;
  };
}

interface EditProjectClientProps {
  project: {
    id: string;
    slug: string;
    titleEn: string | null;
    titleAr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    liveUrl: string | null;
    stack: string[] | null;
    status: "DRAFT" | "PUBLISHED";
  };
  userRole: "ADMIN" | "EDITOR";
  locale: string;
}

export function EditProjectClient({ project, userRole, locale }: EditProjectClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { aiDraftAssistEnabled } = useAdminFlags();
  const [updateProject] = useMutation(UPDATE_PROJECT, { client: apolloClient });
  const [publishProject] = useMutation(PUBLISH_PROJECT, { client: apolloClient });
  const [generateDraftAssist] = useMutation(GENERATE_DRAFT_ASSIST, {
    client: apolloClient,
  });

  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(project.status);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState<AiDraftContent | null>(null);
  const [tags, setTags] = useState<string[]>(project.stack ?? []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  const canPublish = userRole === "ADMIN";

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      slug: project.slug,
      titleEn: project.titleEn ?? "",
      titleAr: project.titleAr ?? "",
      descriptionEn: project.descriptionEn ?? "",
      descriptionAr: project.descriptionAr ?? "",
      stack: joinStack(project.stack),
      liveUrl: project.liveUrl ?? "",
    },
  });

  const syncTagsToForm = useCallback(
    (next: string[]) => {
      setTags(next);
      setValue("stack", joinStack(next), { shouldValidate: true });
    },
    [setValue],
  );

  function addTag() {
    const val = tagInput.trim();
    if (!val || tags.includes(val)) return;
    syncTagsToForm([...tags, val]);
    setTagInput("");
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    syncTagsToForm(tags.filter((t) => t !== tag));
  }

  async function handleDraftAssist(bullets: string[], tone: DraftTone): Promise<AiDraftContent> {
    setAiLoading(true);
    setAiContent(null);
    try {
      const [enRes, arRes] = await Promise.all([
        generateDraftAssist({ variables: { bullets, locale: "EN", tone } }),
        generateDraftAssist({ variables: { bullets, locale: "AR", tone } }),
      ]);
      const en = enRes.data?.generateDraftAssist;
      const ar = arRes.data?.generateDraftAssist;
      if (!en?.available && !ar?.available) message.warning(t("aiDraftAssist.unavailable"));
      const result: AiDraftContent = {
        description: en?.available ? en.description : undefined,
        descriptionAr: ar?.available ? ar.description : undefined,
        seoSummary: en?.seoSummary,
      };
      setAiContent(result);
      return result;
    } catch {
      message.warning(t("aiDraftAssist.unavailable"));
      return {};
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(values: ProjectFormValues) {
    try {
      await updateProject({
        variables: {
          id: project.id,
          input: {
            slug: values.slug,
            titleEn: values.titleEn,
            titleAr: values.titleAr,
            descriptionEn: values.descriptionEn,
            descriptionAr: values.descriptionAr,
            stack: splitStack(values.stack),
            liveUrl: values.liveUrl || undefined,
          },
        },
      });
      message.success(t("projects.updated"));
      router.refresh();
    } catch {
      message.error(t("projects.failedUpdate"));
    }
  }

  async function handlePublish() {
    if (!canPublish) return;
    try {
      await publishProject({ variables: { id: project.id } });
      setStatus("PUBLISHED");
      message.success(t("projects.published"));
      router.refresh();
    } catch {
      message.error(t("projects.failedPublish"));
    }
  }

  async function handleSaveDraft() {
    try {
      await handleSubmit(async (values) => {
        await updateProject({
          variables: {
            id: project.id,
            input: {
              slug: values.slug,
              titleEn: values.titleEn,
              titleAr: values.titleAr,
              descriptionEn: values.descriptionEn,
              descriptionAr: values.descriptionAr,
              stack: splitStack(values.stack),
              liveUrl: values.liveUrl || undefined,
            },
          },
        });
      })();
      message.success(t("projects.saved"));
    } catch {
      message.error(t("projects.failedSave"));
    }
  }

  function handleApplyAiContent(content: AiDraftContent) {
    if (content.description) setValue("descriptionEn", content.description);
    if (content.descriptionAr) setValue("descriptionAr", content.descriptionAr);
    setAiModalOpen(false);
    setAiContent(null);
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-[1280px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-on-surface-variant font-data-label text-data-label">
        <Link
          href={`/${locale}/projects`}
          className="!text-on-surface-variant hover:text-primary transition-colors"
        >
          {t("projects.title")}
        </Link>
        <IconChevronRight className="text-sm" />
        <span className="text-graphite-text">{t("projects.edit")}</span>
      </nav>

      {/* Catalog Card Editor */}
      <div className="bg-surface-card border border-clay-line rounded flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* Left Column: Main Form */}
        <div className="flex-1 p-6 md:border-r border-clay-line">
          {/* Header */}
          <div className="mb-8 border-b border-clay-line pb-4 flex justify-between items-start">
            <div>
              <div className="font-accession-number text-accession-number text-outline mb-2 uppercase">
                ACCESS NUMBER: PRJ-{project.id.slice(0, 4).toUpperCase()}
              </div>
              <h1 className="font-headline-lg text-headline-lg text-graphite-text">
                {t("projects.edit")}
              </h1>
            </div>
            {/* Status Toggle Pill */}
            <div className="flex items-center gap-0.5 bg-chalk-bg border border-clay-line rounded-xl p-1">
              <button
                type="button"
                onClick={() => setStatus("PUBLISHED")}
                className={`font-data-label text-data-label px-3 py-1 rounded-base flex items-center gap-1 transition-colors cursor-pointer ${
                  status === "PUBLISHED"
                    ? "bg-moss text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {status === "PUBLISHED" && <IconPublished className="text-[14px]" />}
                {t("status.published")}
              </button>
              <button
                type="button"
                onClick={() => setStatus("DRAFT")}
                className={`font-data-label text-data-label px-3 py-1 rounded-base flex items-center gap-1 transition-colors cursor-pointer ${
                  status === "DRAFT"
                    ? "bg-ochre text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {t("status.draft")}
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {/* Title (English) */}
            <div className="flex flex-col gap-2">
              <label
                className="font-data-label text-data-label text-graphite-text"
                htmlFor="project_title"
              >
                {t("content.titleEn")}
              </label>
              <Controller
                name="titleEn"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="project_title"
                    type="text"
                    className="w-full bg-chalk-bg border border-clay-line rounded p-3 font-headline-md text-headline-md text-graphite-text focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition-all"
                  />
                )}
              />
            </div>

            {/* Title (Arabic) */}
            <div className="flex flex-col gap-2">
              <label
                className="font-data-label text-data-label text-graphite-text"
                htmlFor="project_title_ar"
              >
                {t("content.titleAr")}
              </label>
              <Controller
                name="titleAr"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="project_title_ar"
                    type="text"
                    dir="rtl"
                    className="w-full bg-chalk-bg border border-clay-line rounded p-3 font-headline-md text-headline-md text-graphite-text focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition-all"
                  />
                )}
              />
            </div>

            {/* Description (English) */}
            <div className="flex flex-col gap-2">
              <label
                className="font-data-label text-data-label text-graphite-text"
                htmlFor="project_desc"
              >
                {t("content.descriptionEn")}
              </label>
              <Controller
                name="descriptionEn"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="project_desc"
                    rows={6}
                    className="w-full bg-chalk-bg border border-clay-line rounded p-3 font-body-md text-body-md text-graphite-text focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition-all resize-y"
                  />
                )}
              />
            </div>

            {/* Description (Arabic) */}
            <div className="flex flex-col gap-2">
              <label
                className="font-data-label text-data-label text-graphite-text"
                htmlFor="project_desc_ar"
              >
                {t("content.descriptionAr")}
              </label>
              <Controller
                name="descriptionAr"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="project_desc_ar"
                    rows={6}
                    dir="rtl"
                    className="w-full bg-chalk-bg border border-clay-line rounded p-3 font-body-md text-body-md text-graphite-text focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition-all resize-y"
                  />
                )}
              />
            </div>

            {aiDraftAssistEnabled && (
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="border border-dashed border-clay-line text-on-surface-variant font-data-label text-data-label py-2 px-4 rounded flex items-center gap-2 hover:text-graphite-text hover:border-graphite-text transition-colors cursor-pointer"
              >
                <IconAiAssist className="text-sm" />
                {t("aiDraftAssist.cta")}
              </button>
            )}

            <AiDraftAssistModal
              open={aiModalOpen}
              loading={aiLoading}
              content={aiContent}
              onGenerate={handleDraftAssist}
              onApply={handleApplyAiContent}
              onCancel={() => {
                setAiModalOpen(false);
                setAiContent(null);
              }}
            />

            {/* Action Buttons (mobile) */}
            <div className="flex gap-4 pt-6 border-t border-clay-line md:hidden">
              <button
                type="button"
                disabled={!canPublish}
                onClick={handlePublish}
                className="flex-1 bg-moss text-on-primary font-data-label text-data-label py-3 px-4 rounded border border-transparent hover:bg-dark-moss transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <IconUpload className="text-[18px]" />
                {t("projects.publishChanges")}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 bg-transparent text-graphite-text font-data-label text-data-label py-3 px-4 rounded border border-clay-line hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconSave className="text-[18px]" />
                {t("projects.saveDraft")}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="w-full md:w-80 bg-surface-card flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <h2 className="font-data-label text-data-label text-outline border-b border-clay-line pb-2 mb-4 uppercase">
              {t("content.metadata")}
            </h2>

            {/* Slug */}
            <div className="flex flex-col gap-1">
              <label
                className="font-data-label text-data-label text-on-surface-variant"
                htmlFor="meta_slug"
              >
                {t("content.slug")}
              </label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="meta_slug"
                    type="text"
                    className="w-full bg-transparent border-b border-clay-line pb-1 font-accession-number text-accession-number text-graphite-text focus:outline-none focus:border-graphite-text transition-all rounded-none px-0"
                  />
                )}
              />
            </div>

            {/* Author (read-only display) */}
            <div className="flex flex-col gap-1">
              <label
                className="font-data-label text-data-label text-on-surface-variant"
                htmlFor="meta_author"
              >
                {t("content.author")}
              </label>
              <div className="w-full bg-transparent border-b border-clay-line pb-1 font-accession-number text-accession-number text-graphite-text rounded-none px-0">
                Tessera Admin
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="font-data-label text-data-label text-on-surface-variant">
                {t("content.tags")}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-clay-line bg-chalk-bg font-accession-number text-accession-number px-2 py-1 flex items-center gap-1 cursor-pointer hover:border-graphite-text transition-colors"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-on-surface-variant hover:text-graphite-text cursor-pointer"
                      aria-label={t("aria.removeTag", { tag })}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <div className="flex items-center">
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("content.addTag")}
                    className="border border-dashed border-clay-line text-on-surface-variant font-accession-number text-accession-number px-2 py-1 w-20 focus:outline-none focus:border-graphite-text focus:text-graphite-text transition-colors rounded-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Live URL */}
            <div className="flex flex-col gap-1">
              <label
                className="font-data-label text-data-label text-on-surface-variant"
                htmlFor="meta_liveUrl"
              >
                {t("content.liveUrl")}
              </label>
              <Controller
                name="liveUrl"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="meta_liveUrl"
                    type="url"
                    placeholder="https://example.com"
                    className="w-full bg-transparent border-b border-clay-line pb-1 font-accession-number text-accession-number text-graphite-text focus:outline-none focus:border-graphite-text transition-all rounded-none px-0"
                  />
                )}
              />
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-clay-line mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-data-label text-data-label text-outline">
                  {t("content.created")}
                </span>
                <span className="font-accession-number text-accession-number text-graphite-text">
                  {new Date().toISOString().split("T")[0]} 09:12Z
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-data-label text-data-label text-outline">
                  {t("content.modified")}
                </span>
                <span className="font-accession-number text-accession-number text-graphite-text">
                  {new Date().toISOString().split("T")[0]} 14:45Z
                </span>
              </div>
            </div>
          </div>

          {/* Actions (sticky bottom) */}
          <div className="p-6 border-t border-clay-line bg-chalk-bg/50 hidden md:block">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={!canPublish}
                onClick={handlePublish}
                className="w-full bg-moss text-on-primary font-data-label text-data-label py-3 px-4 rounded border border-transparent hover:bg-dark-moss transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <IconUpload className="text-[18px]" />
                {t("projects.publishChanges")}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full bg-transparent text-graphite-text font-data-label text-data-label py-3 px-4 rounded border border-clay-line hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconSave className="text-[18px]" />
                {t("projects.saveDraft")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
