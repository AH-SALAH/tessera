// app/[locale]/(public)/accept-invite/page.tsx
// Server component that renders the AcceptInviteClient with the token from search params.

import { Suspense } from "react";
import { AcceptInviteClient } from "./AcceptInviteClient";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense>
      <AcceptInviteClient token={resolvedSearchParams.token} />
    </Suspense>
  );
}
