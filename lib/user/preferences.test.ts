/// <reference types="vitest/globals" />
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "@/lib/auth/session";
import { PATCH } from "@/app/api/user/preferences/route";

function jsonRequest(body: object, cookie?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return new Request("http://localhost:3000/api/user/preferences", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/user/preferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ locale: "ar" }) as any);
    expect(res.status).toBe(401);
  });

  it("persists locale to User row when authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "ADMIN", theme: "light" },
    });
    vi.mocked(prisma.user.update).mockResolvedValue({
      locale: "ar",
      theme: "light",
    } as any);

    const res = await PATCH(jsonRequest({ locale: "ar" }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.locale).toBe("ar");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { locale: "ar" },
      select: { locale: true, theme: true },
    });
  });

  it("persists theme to User row when authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "ADMIN", theme: "light" },
    });
    vi.mocked(prisma.user.update).mockResolvedValue({
      locale: "en",
      theme: "dark",
    } as any);

    const res = await PATCH(jsonRequest({ theme: "dark" }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.theme).toBe("dark");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { theme: "dark" },
      select: { locale: true, theme: true },
    });
  });

  it("rejects invalid locale values", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "ADMIN", theme: "light" },
    });

    const res = await PATCH(jsonRequest({ locale: "fr" }) as any);
    expect(res.status).toBe(400);
  });

  it("rejects invalid theme values", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "ADMIN", theme: "light" },
    });

    const res = await PATCH(jsonRequest({ theme: "neon" }) as any);
    expect(res.status).toBe(400);
  });

  it("does not touch anonymous cookie preferences", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "u1", email: "a@b.com", role: "EDITOR", theme: "system" },
    });
    vi.mocked(prisma.user.update).mockResolvedValue({
      locale: "en",
      theme: "system",
    } as any);

    await PATCH(jsonRequest({ locale: "en" }) as any);

    // Verify only locale/theme are sent — never cookies
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("cookies");
    expect(updateCall.data).not.toHaveProperty("NEXT_LOCALE");
  });
});
