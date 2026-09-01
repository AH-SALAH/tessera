// components/ui/StatusBadge.tsx
// Reusable primitive (Constitution Article VIII) — used anywhere a content status renders,
// public or admin. Never color-only (accessibility baseline, DESIGN.md §5): the text label
// is always present alongside the Moss/Ochre color.

"use client";

import { useTranslation } from "react-i18next";
import { IconPublished, IconDraft } from "@/components/ui/icons";

export type ContentStatus = "DRAFT" | "PUBLISHED";

interface StatusBadgeProps {
  status: ContentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const isPublished = status === "PUBLISHED";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-base border px-2 py-0.5",
        "font-mono text-xs",
        isPublished ? "border-moss text-moss" : "border-ochre text-ochre",
      ].join(" ")}
    >
      {isPublished ? (
        <IconPublished aria-hidden="true" className="text-xs" />
      ) : (
        <IconDraft aria-hidden="true" className="text-xs" />
      )}
      {isPublished ? t("status.published") : t("status.draft")}
    </span>
  );
}
