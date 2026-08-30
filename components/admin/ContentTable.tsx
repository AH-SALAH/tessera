// components/admin/ContentTable.tsx
// Reusable admin list view (Constitution Article VIII) — catalog-card-drawer style vertical list
// per DESIGN.md §3: "Admin list views use a dense, card-catalog-drawer-style vertical list
// rather than a generic data table wherever the content is browsable by a human."

"use client";

import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { IconEdit, IconDelete } from "@/components/ui/icons";
import { StatusBadge, type ContentStatus } from "@/components/ui/StatusBadge";
import { CatalogCard } from "@/components/ui/CatalogCard";

export interface ContentRow {
  id: string;
  accessionNumber: string;
  slug: string;
  title: string;
  metaLine: string;
  status: ContentStatus;
}

interface ContentTableProps {
  rows: ContentRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContentTable({ rows, onEdit, onDelete }: ContentTableProps) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p>{t("content.noContent")}</p>
        <p className="text-sm mt-1">{t("content.createFirst")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <CatalogCard
          key={row.id}
          accessionNumber={row.accessionNumber}
          title={row.title}
          metaLine={row.metaLine}
          status={row.status}
        >
          <div className="flex gap-2">
            <Tooltip title={`${t("content.edit")} ${row.title}`}>
              <Button
                size="small"
                onClick={() => onEdit(row.id)}
                icon={<IconEdit />}
                aria-label={`${t("content.edit")} ${row.title}`}
              />
            </Tooltip>
            <Tooltip title={`${t("content.delete")} ${row.title}`}>
              <Button
                size="small"
                danger
                onClick={() => onDelete(row.id)}
                icon={<IconDelete />}
                aria-label={`${t("content.delete")} ${row.title}`}
              />
            </Tooltip>
          </div>
        </CatalogCard>
      ))}
    </div>
  );
}
