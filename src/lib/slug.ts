// lib/slug.ts
// Shared slug deduplication — used by Project, Post, Testimonial resolvers.

/**
 * Given a desired slug, return a unique version by appending -1, -2, etc.
 * if the slug already exists in the database.
 *
 * Uses a single MAX query to find the highest existing suffix — O(1) queries
 * regardless of duplicate count.
 *
 * @param existsFn - Callback that returns true if the slug is taken.
 *   For updates, the caller should exclude the current record.
 * @param findMaxSuffixFn - Callback that returns the highest numeric suffix
 *   for the given base slug, or 0 if none exist. The caller should also
 *   exclude the current record when applicable.
 */
export async function deduplicateSlug(
  desiredSlug: string,
  existsFn: (slug: string) => Promise<boolean>,
  findMaxSuffixFn: (base: string) => Promise<number>,
): Promise<string> {
  if (!(await existsFn(desiredSlug))) return desiredSlug;
  const base = desiredSlug.replace(/-\d+$/, "");
  const next = (await findMaxSuffixFn(base)) + 1;
  return `${base}-${next}`;
}
