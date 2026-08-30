import type { Meta, StoryObj } from "@storybook/react";
import { ContentForm } from "./ContentForm";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Initialise i18next once for Storybook with a flat EN dictionary matching
// the keys the admin components use. This runs in the browser — no jest.mock.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        translation: {
          "content.slug": "Slug",
          "content.titleEn": "Title (English)",
          "content.titleAr": "Title (Arabic)",
          "content.descriptionEn": "Description (English)",
          "content.descriptionAr": "Description (Arabic)",
          "content.stack": "Stack",
          "content.liveUrl": "Live URL",
          "content.addNew": "Save",
          "content.publish": "Publish",
          "content.publishAdminOnly": "Only admins can publish",
          "content.delete": "Delete",
          "content.edit": "Edit",
          "aiDraftAssist.cta": "Generate Draft",
          "aiDraftAssist.loading": "Generating…",
          "aiDraftAssist.tone.academic": "Academic Formal",
          "aiDraftAssist.tone.curatorial": "Curatorial Summary",
          "aiDraftAssist.tone.exhibition": "Public Exhibition",
          "aiDraftAssist.input.bullets": "Bullet Points / Core Facts",
          "aiDraftAssist.input.bulletsPlaceholder":
            "- Found in sector 4B...\n- Carbon dated to ~4500 BCE...\n- Incised geometric patterns...",
          "aiDraftAssist.input.tone": "Tone / Style",
          "aiDraftAssist.output.reqId": "REQ-ID: GEN-2948-AX",
          "aiDraftAssist.output.draftTitle": "Draft Description",
          "aiDraftAssist.output.statusPending": "Pending Generation",
          "aiDraftAssist.output.statusGenerating": "Generating…",
          "aiDraftAssist.output.statusReady": "Ready",
          "aiDraftAssist.output.emptyState":
            "Enter bullet points and click Generate to create a draft.",
          "aiDraftAssist.modal.title": "AI Draft Assist",
          "aiDraftAssist.modal.apply": "Apply to Field",
          "aiDraftAssist.modal.cancel": "Discard",
          "aiDraftAssist.modal.seoSummary": "SEO Summary",
          "status.published": "Published",
          "status.draft": "Draft",
        },
      },
    },
    interpolation: { escapeValue: false },
  });
}

const meta: Meta<typeof ContentForm> = {
  title: "Admin/ContentForm",
  component: ContentForm,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof ContentForm>;

export const EditorView: Story = {
  args: {
    canPublish: false,
    aiDraftAssistEnabled: false,
    onSubmit: async (values) => console.log("submit", values),
  },
};

export const AdminViewWithAI: Story = {
  args: {
    canPublish: true,
    aiDraftAssistEnabled: true,
    onSubmit: async (values) => console.log("submit", values),
    onPublish: async () => console.log("publish"),
    onGenerateDraftAssist: async () => ({
      description: "AI-generated project description goes here.",
      descriptionAr: "وصف المشروع المُنشأ بالذكاء الاصطناعي.",
      seoSummary: "AI-generated SEO summary for search engines.",
    }),
  },
};

export const EditingExisting: Story = {
  args: {
    defaultValues: {
      slug: "pulsefeed",
      titleEn: "PulseFeed",
      titleAr: "ب尔斯 فيد",
      descriptionEn: "Real-time market data platform built with Next.js and WebSockets.",
      descriptionAr: "منصة بيانات سوق في الوقت الفعلي مبنية على Next.js و WebSocket.",
      stack: "Next.js, TypeScript, D3.js, WebSockets",
      liveUrl: "https://pulsefeed.example.com",
    },
    canPublish: true,
    aiDraftAssistEnabled: false,
    onSubmit: async (values) => console.log("submit", values),
    onPublish: async () => console.log("publish"),
  },
};
