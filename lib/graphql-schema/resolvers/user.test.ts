/// <reference types="vitest/globals" />
import { userResolvers } from "./user";
import { GraphQLError } from "graphql";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth/email", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("inviteUser authorization matrix", () => {
  let adminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    adminUserId = admin!.id;
  });

  beforeEach(async () => {
    await prisma.invitation.deleteMany({ where: { email: { startsWith: "invite-test-" } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "invite-test-" } } });
  });

  const createContext = (userId: string, role: "ADMIN" | "EDITOR") => ({
    session: { user: { id: userId, role } },
  });

  describe("inviteUser", () => {
    it("allows ADMIN to invite EDITOR", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Mutation.inviteUser(
        null,
        { email: "invite-test-editor@example.com", role: "EDITOR" },
        ctx,
      );
      expect(result).toHaveProperty("id");
      expect(result.email).toBe("invite-test-editor@example.com");
      expect(result.role).toBe("EDITOR");
      expect(result.acceptedAt).toBeNull();

      const invitation = await prisma.invitation.findUnique({ where: { id: result.id } });
      expect(invitation).not.toBeNull();
    });

    it("allows ADMIN to invite ADMIN", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Mutation.inviteUser(
        null,
        { email: "invite-test-admin@example.com", role: "ADMIN" },
        ctx,
      );
      expect(result.role).toBe("ADMIN");
    });

    it("rejects EDITOR", async () => {
      const editor = await prisma.user.findFirst({ where: { role: "EDITOR" } });
      const ctx = createContext(editor!.id, "EDITOR");
      await expect(
        userResolvers.Mutation.inviteUser(
          null,
          { email: "invite-test-forbidden@example.com", role: "EDITOR" },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        userResolvers.Mutation.inviteUser(
          null,
          { email: "invite-test-unauth@example.com", role: "EDITOR" },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("rejects duplicate email (existing user)", async () => {
      const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const ctx = createContext(adminUserId, "ADMIN");
      await expect(
        userResolvers.Mutation.inviteUser(null, { email: existing!.email, role: "EDITOR" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "USER_EXISTS" } });
    });

    it("rejects duplicate email (pending invitation)", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      await userResolvers.Mutation.inviteUser(
        null,
        { email: "invite-test-dup@example.com", role: "EDITOR" },
        ctx,
      );
      await expect(
        userResolvers.Mutation.inviteUser(
          null,
          { email: "invite-test-dup@example.com", role: "ADMIN" },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "INVITE_EXISTS" } });
    });
  });

  describe("resendInvite", () => {
    let invitationId: string;

    beforeEach(async () => {
      const result = await userResolvers.Mutation.inviteUser(
        null,
        { email: "invite-test-resend@example.com", role: "EDITOR" },
        createContext(adminUserId, "ADMIN"),
      );
      invitationId = result.id;
    });

    it("allows ADMIN to resend invite", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Mutation.resendInvite(null, { invitationId }, ctx);
      expect(result.id).toBe(invitationId);
      expect(result.expiresAt).toBeDefined();
    });

    it("rejects EDITOR", async () => {
      const editor = await prisma.user.findFirst({ where: { role: "EDITOR" } });
      const ctx = createContext(editor!.id, "EDITOR");
      await expect(
        userResolvers.Mutation.resendInvite(null, { invitationId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects non-existent invitation", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      await expect(
        userResolvers.Mutation.resendInvite(null, { invitationId: "non-existent-id" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "INVITE_NOT_FOUND" } });
    });
  });

  describe("acceptInvite", () => {
    let inviteToken: string;

    beforeEach(async () => {
      const result = await userResolvers.Mutation.inviteUser(
        null,
        { email: "invite-test-accept@example.com", role: "EDITOR" },
        createContext(adminUserId, "ADMIN"),
      );
      const invitation = await prisma.invitation.findUnique({ where: { id: result.id } });
      inviteToken = invitation!.token;
    });

    it("creates user and marks invitation accepted", async () => {
      const result = await userResolvers.Mutation.acceptInvite(null, {
        token: inviteToken,
        name: "New User",
        password: "SecurePass123!",
      });
      expect(result).toBe(true);

      const user = await prisma.user.findUnique({
        where: { email: "invite-test-accept@example.com" },
      });
      expect(user).not.toBeNull();
      expect(user!.name).toBe("New User");
      expect(user!.role).toBe("EDITOR");

      const invitation = await prisma.invitation.findUnique({ where: { token: inviteToken } });
      expect(invitation!.acceptedAt).not.toBeNull();
    });

    it("rejects expired token", async () => {
      // Create an expired invitation
      const expired = await prisma.invitation.create({
        data: {
          email: "invite-test-expired@example.com",
          token: "expired-token-123",
          role: "EDITOR",
          expiresAt: new Date(Date.now() - 86400000), // expired 1 day ago
        },
      });
      await expect(
        userResolvers.Mutation.acceptInvite(null, {
          token: expired.token,
          name: "Expired User",
          password: "SecurePass123!",
        }),
      ).rejects.toMatchObject({ extensions: { code: "INVITE_EXPIRED" } });
    });

    it("rejects invalid token", async () => {
      await expect(
        userResolvers.Mutation.acceptInvite(null, {
          token: "invalid-token",
          name: "Invalid User",
          password: "SecurePass123!",
        }),
      ).rejects.toMatchObject({ extensions: { code: "INVITE_NOT_FOUND" } });
    });

    it("rejects already accepted invitation", async () => {
      await userResolvers.Mutation.acceptInvite(null, {
        token: inviteToken,
        name: "First User",
        password: "SecurePass123!",
      });
      await expect(
        userResolvers.Mutation.acceptInvite(null, {
          token: inviteToken,
          name: "Second User",
          password: "SecurePass123!",
        }),
      ).rejects.toMatchObject({ extensions: { code: "INVITE_NOT_FOUND" } });
    });
  });

  describe("pendingInvitations", () => {
    it("allows ADMIN to list pending invitations", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Query.pendingInvitations(null, {}, ctx);
      expect(Array.isArray(result)).toBe(true);
    });

    it("rejects EDITOR", async () => {
      const editor = await prisma.user.findFirst({ where: { role: "EDITOR" } });
      const ctx = createContext(editor!.id, "EDITOR");
      await expect(userResolvers.Query.pendingInvitations(null, {}, ctx)).rejects.toMatchObject({
        extensions: { code: "FORBIDDEN" },
      });
    });
  });

  describe("updateUserRole", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: { email: `update-test-${Date.now()}@example.com`, role: "EDITOR" },
      });
      testUserId = user.id;
    });

    afterEach(async () => {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    });

    it("allows ADMIN to change role", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Mutation.updateUserRole(
        null,
        { id: testUserId, role: "ADMIN" },
        ctx,
      );
      expect(result.role).toBe("ADMIN");
    });

    it("rejects EDITOR", async () => {
      const editor = await prisma.user.findFirst({ where: { role: "EDITOR" } });
      const ctx = createContext(editor!.id, "EDITOR");
      await expect(
        userResolvers.Mutation.updateUserRole(null, { id: testUserId, role: "ADMIN" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        userResolvers.Mutation.updateUserRole(null, { id: testUserId, role: "ADMIN" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("rejects non-existent user", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      await expect(
        userResolvers.Mutation.updateUserRole(null, { id: "non-existent-id", role: "ADMIN" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "USER_NOT_FOUND" } });
    });
  });

  describe("deleteUser", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: { email: `delete-test-${Date.now()}@example.com`, role: "EDITOR" },
      });
      testUserId = user.id;
    });

    it("allows ADMIN to delete user", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await userResolvers.Mutation.deleteUser(null, { id: testUserId }, ctx);
      expect(result).toBe(true);

      const deleted = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(deleted).toBeNull();
    });

    it("prevents ADMIN from deleting self", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      await expect(
        userResolvers.Mutation.deleteUser(null, { id: adminUserId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "CANNOT_DELETE_SELF" } });
    });

    it("rejects EDITOR", async () => {
      const editor = await prisma.user.findFirst({ where: { role: "EDITOR" } });
      const ctx = createContext(editor!.id, "EDITOR");
      await expect(
        userResolvers.Mutation.deleteUser(null, { id: testUserId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        userResolvers.Mutation.deleteUser(null, { id: testUserId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("rejects non-existent user", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      await expect(
        userResolvers.Mutation.deleteUser(null, { id: "non-existent-id" }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "USER_NOT_FOUND" } });
    });
  });
});
