// components/ui/CatalogCard.tsx
// The core content-display primitive (DESIGN.md §3). Composed, not duplicated, everywhere a
// Project/Post/Testimonial renders publicly — Constitution Article VIII.

"use client";

import { StatusBadge, type ContentStatus } from "./StatusBadge";

interface CatalogCardProps {
  accessionNumber: string; // e.g. "PRJ-014" — the museum-tag-style identifier, DESIGN.md §3
  title: string;
  metaLine: string; // e.g. stack summary or date, rendered in the mono face
  status: ContentStatus;
  localeFallback?: boolean;
  children?: React.ReactNode;
}

export function CatalogCard({
  accessionNumber,
  title,
  metaLine,
  status,
  localeFallback,
  children,
}: CatalogCardProps) {
  return (
    <article className="rounded-base border border-clay-line bg-surface p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-mono text-xs text-muted">{accessionNumber}</span>
        <StatusBadge status={status} />
      </div>
      <h3 className="font-display text-lg text-graphite">{title}</h3>
      <p className="mt-1 font-mono text-xs text-muted">
        {metaLine}
        {localeFallback && (
          <span className="ms-2 italic text-ochre">(showing fallback locale)</span>
        )}
      </p>
      {children && <div className="mt-3 font-body text-sm text-graphite">{children}</div>}
    </article>
  );
}
