/// <reference types="vitest/globals" />
import { requireRole } from "./auth-guard";
import { GraphQLError } from "graphql";

describe("requireRole", () => {
  const mockResolver = vi.fn().mockResolvedValue("success");
  const wrappedResolver = requireRole(["ADMIN"], mockResolver);

  const createContext = (role?: "ADMIN" | "EDITOR", userId = "user-1") => ({
    session: role ? { user: { id: userId, role } } : null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UNAUTHENTICATED when no session", async () => {
    const ctx = createContext(undefined);

    await expect(wrappedResolver(null, {}, ctx)).rejects.toThrow(GraphQLError);
    await expect(wrappedResolver(null, {}, ctx)).rejects.toMatchObject({
      extensions: { code: "UNAUTHENTICATED" },
    });
    expect(mockResolver).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when role not in allowed list", async () => {
    const ctx = createContext("EDITOR");

    await expect(wrappedResolver(null, {}, ctx)).rejects.toThrow(GraphQLError);
    await expect(wrappedResolver(null, {}, ctx)).rejects.toMatchObject({
      extensions: { code: "FORBIDDEN" },
    });
    expect(mockResolver).not.toHaveBeenCalled();
  });

  it("calls through to resolver when role is allowed", async () => {
    const ctx = createContext("ADMIN");

    const result = await wrappedResolver(null, { arg: "value" }, ctx);

    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalledWith(null, { arg: "value" }, ctx);
  });

  it("allows multiple roles", async () => {
    const multiRoleResolver = requireRole(["ADMIN", "EDITOR"], mockResolver);
    const ctx = createContext("EDITOR");

    const result = await multiRoleResolver(null, {}, ctx);

    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalled();
  });

  it("passes parent, args, context to resolver", async () => {
    const ctx = createContext("ADMIN", "user-123");
    const parent = { some: "parent" };
    const args = { input: { name: "test" } };

    await wrappedResolver(parent, args, ctx);

    expect(mockResolver).toHaveBeenCalledWith(parent, args, ctx);
  });
});
