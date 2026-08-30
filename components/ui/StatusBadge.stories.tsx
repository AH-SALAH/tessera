import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "UI/StatusBadge",
  component: StatusBadge,
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Published: Story = { args: { status: "PUBLISHED" } };
export const Draft: Story = { args: { status: "DRAFT" } };
