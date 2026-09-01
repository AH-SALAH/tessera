// lib/validation/project.ts
// Article V single source of truth for Project input validation.
// Both the GraphQL resolvers (server truth) and the admin ContentForm
// (client UX variant via .extend) derive their rules from this file.
import { z } from "zod";

export const projectInputSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required").max(120),
  titleEn: z.string().trim().min(1, "Title is required").max(200),
  titleAr: z.string().trim().max(200).optional(),
  descriptionEn: z.string().min(1, "Description is required").max(5000),
  descriptionAr: z.string().max(5000).optional(),
  // GraphQL wire format: [String!] — the comma-separated UI string is a
  // client-only concern converted with splitStack/joinStack below.
  stack: z.array(z.string().trim().min(1)).optional(),
  liveUrl: z.union([z.literal(""), z.string().url("Must be a valid URL")]).optional(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/** Convert the form's comma-separated stack string into the wire format. */
export function splitStack(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Convert the wire-format stack array into the form's display string. */
export function joinStack(value: readonly string[] | null | undefined): string {
  return (value ?? []).join(", ");
}
