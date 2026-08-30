// app/[locale]/(admin)/admin-flags.tsx
// T046 — flag state is fetched ONCE at the admin layout level (server component) and passed
// down through this context. Per FR-010 and tasks.md T046, individual components consume the
// pre-fetched value via useAdminFlags() instead of re-checking the flag per-component, and
// the draft-assist control is fully ABSENT (not disabled) when the flag is off.
"use client";

import { createContext, useContext, ReactNode } from "react";

export interface AdminFlags {
  aiDraftAssistEnabled: boolean;
}

const defaultFlags: AdminFlags = { aiDraftAssistEnabled: false };

const AdminFlagsContext = createContext<AdminFlags>(defaultFlags);

export function AdminFlagsProvider({
  flags,
  children,
}: {
  flags: AdminFlags;
  children: ReactNode;
}) {
  return <AdminFlagsContext.Provider value={flags}>{children}</AdminFlagsContext.Provider>;
}

export function useAdminFlags(): AdminFlags {
  return useContext(AdminFlagsContext);
}
