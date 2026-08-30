import type { Meta, StoryObj } from "@storybook/react";
import { ContentTable } from "./ContentTable";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Same i18next init as ContentForm.stories — runs once in the browser.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        translation: {
          "status.published": "Published",
          "status.draft": "Draft",
          "content.delete": "Delete",
          "content.edit": "Edit",
          "content.noContent": "No content yet",
          "content.createFirst": "Create your first item to get started",
        },
      },
    },
    interpolation: { escapeValue: false },
  });
}

const meta: Meta<typeof ContentTable> = {
  title: "Admin/ContentTable",
  component: ContentTable,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof ContentTable>;

const sampleRows = [
  {
    id: "1",
    accessionNumber: "PRJ-014",
    slug: "pulsefeed",
    title: "PulseFeed — Real-Time Market Data Platform",
    metaLine: "Next.js · WebSockets · D3.js",
    status: "PUBLISHED" as const,
  },
  {
    id: "2",
    accessionNumber: "PRJ-015",
    slug: "tessera",
    title: "Tessera — Content Management Platform",
    metaLine: "Next.js · GraphQL · Prisma",
    status: "DRAFT" as const,
  },
  {
    id: "3",
    accessionNumber: "PRJ-016",
    slug: "arc-lights",
    title: "Arc Lights — Sensor Visualization",
    metaLine: "React, D3.js, WebSocket",
    status: "DRAFT" as const,
  },
];

export const Populated: Story = {
  args: {
    rows: sampleRows,
    onEdit: (id) => console.log("edit", id),
    onDelete: (id) => console.log("delete", id),
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    onEdit: () => {},
    onDelete: () => {},
  },
};
