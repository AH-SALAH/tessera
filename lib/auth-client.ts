// lib/auth-client.ts
// Better Auth React client (single instance, Constitution Article V).
// Used by client components for sign-out, session hydration, etc.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
