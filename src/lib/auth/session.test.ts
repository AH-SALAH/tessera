/// <reference types="vitest/globals" />
import { getServerSession } from "./session";
import { auth } from "./config";

vi.mock("./config", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const mockGetSession = vi.mocked(auth.api.getSession);

describe("getServerSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie", async () => {
    mockGetSession.mockResolvedValue(null);

    const session = await getServerSession(new Request("http://localhost"));

    expect(session).toBeNull();
    expect(mockGetSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it("returns null when session exists but no user", async () => {
    mockGetSession.mockResolvedValue({
      session: null,
      user: null,
    } as any);

    const session = await getServerSession(new Request("http://localhost"));

    expect(session).toBeNull();
  });

  it("returns correct session shape with user id, email, role, theme", async () => {
    mockGetSession.mockResolvedValue({
      session: {
        id: "sess-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        expiresAt: new Date(Date.now() + 86400000),
        token: "token-1",
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "test@example.com",
        emailVerified: true,
        name: "Test User",
        image: null,
        role: "ADMIN",
        theme: "dark",
        locale: "en",
      },
    } as any);

    const session = await getServerSession(new Request("http://localhost"));

    expect(session).toEqual({
      user: {
        id: "user-1",
        email: "test@example.com",
        role: "ADMIN",
        theme: "dark",
      },
    });
  });

  it("defaults theme to 'system' when not set", async () => {
    mockGetSession.mockResolvedValue({
      session: {
        id: "sess-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        expiresAt: new Date(Date.now() + 86400000),
        token: "token-1",
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        email: "test@example.com",
        emailVerified: true,
        name: "Test User",
        image: null,
        role: "EDITOR",
        theme: undefined,
        locale: "en",
      },
    } as any);

    const session = await getServerSession(new Request("http://localhost"));

    expect(session?.user.theme).toBe("system");
  });
});
