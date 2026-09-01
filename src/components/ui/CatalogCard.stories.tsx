import type { Meta, StoryObj } from "@storybook/react";
import { CatalogCard } from "./CatalogCard";

const meta: Meta<typeof CatalogCard> = {
  title: "UI/CatalogCard",
  component: CatalogCard,
};
export default meta;
type Story = StoryObj<typeof CatalogCard>;

export const Published: Story = {
  args: {
    accessionNumber: "PRJ-014",
    title: "PulseFeed — Real-Time Market Data Platform",
    metaLine: "Next.js · WebSockets · D3.js",
    status: "PUBLISHED",
  },
};

export const Draft: Story = {
  args: {
    accessionNumber: "PRJ-015",
    title: "Untitled draft",
    metaLine: "Last edited today",
    status: "DRAFT",
  },
};

export const LocaleFallback: Story = {
  args: {
    accessionNumber: "PRJ-014",
    title: "PulseFeed (English fallback)",
    metaLine: "Next.js · WebSockets · D3.js",
    status: "PUBLISHED",
    localeFallback: true,
  },
};
