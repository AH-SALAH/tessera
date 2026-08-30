// proxy.ts
// Single proxy layer handling two concerns per plan.md's Technical Context:
//  1. Locale detection/redirect for the public [locale] segment
//  2. Session gating for admin routes — redirect to sign-in if no Better Auth session cookie
// Kept as one file per Constitution Article V (one place for cross-cutting request logic),
// not scattered across separate middleware-like checks in individual pages.

import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en";
const SESSION_COOKIE_NAME = "better-auth.session_token";

function resolveLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as any)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage?.startsWith("ar")) return "ar";

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Session-based redirects
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  // Admin routes: require a session regardless of locale prefix.
  const isAdminRoute = /^\/(en|ar)\/admin(\/|$)/.test(pathname);
  if (isAdminRoute) {
    if (!hasSession) {
      const signInUrl = new URL(`/${resolveLocale(request)}/sign-in`, request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Sign-in page: if already authenticated, redirect to dashboard.
  const signInMatch = pathname.match(/^\/(en|ar)\/sign-in\/?$/);
  if (signInMatch && hasSession) {
    const locale = signInMatch[1]; // extract locale from the URL itself
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Locale redirect for un-prefixed paths.
  const hasLocalePrefix = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocalePrefix && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const locale = resolveLocale(request);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets/).*)"],
};
