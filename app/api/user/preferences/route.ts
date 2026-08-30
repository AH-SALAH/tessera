// app/api/user/preferences/route.ts
// Account-scoped locale/theme preferences for authenticated admin users (FR-012).
// Separate from public-site cookie-based preferences.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { locale: true, theme: true },
  });

  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ locale: user.locale, theme: user.theme });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json();
  const { locale, theme } = body as { locale?: string; theme?: string };

  const updateData: { locale?: string; theme?: string } = {};
  if (locale && ["en", "ar"].includes(locale)) updateData.locale = locale;
  if (theme && ["light", "dark", "system"].includes(theme)) updateData.theme = theme;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { locale: true, theme: true },
  });

  return NextResponse.json({ locale: user.locale, theme: user.theme });
}
