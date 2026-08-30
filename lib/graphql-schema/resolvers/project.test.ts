/// <reference types="vitest/globals" />
import { projectResolvers } from "./project";
import { GraphQLError } from "graphql";
import { prisma } from "@/lib/prisma";

describe("Project mutation authorization matrix", () => {
  let adminUserId: string;
  let editorUserId: string;
  let otherEditorUserId: string;
  let adminProjectId: string;
  let editorDraftId: string;
  let editorPublishedId: string;
  let otherEditorDraftId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    adminUserId = admin!.id;

    const editor = await prisma.user.findFirst({
      where: { role: "EDITOR", email: "editor@test.com" },
    });
    editorUserId = editor!.id;

    const otherEditor = await prisma.user.findFirst({
      where: { role: "EDITOR", email: "editor2@test.com" },
    });
    otherEditorUserId = otherEditor!.id;
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();

    const adminProject = await prisma.project.create({
      data: { slug: "admin-proj", titleEn: "Admin Proj", status: "DRAFT", authorId: adminUserId },
    });
    adminProjectId = adminProject.id;

    const editorDraft = await prisma.project.create({
      data: {
        slug: "editor-draft",
        titleEn: "Editor Draft",
        status: "DRAFT",
        authorId: editorUserId,
      },
    });
    editorDraftId = editorDraft.id;

    const editorPublished = await prisma.project.create({
      data: {
        slug: "editor-published",
        titleEn: "Editor Published",
        status: "PUBLISHED",
        authorId: editorUserId,
      },
    });
    editorPublishedId = editorPublished.id;

    const otherEditorDraft = await prisma.project.create({
      data: {
        slug: "other-editor-draft",
        titleEn: "Other Editor Draft",
        status: "DRAFT",
        authorId: otherEditorUserId,
      },
    });
    otherEditorDraftId = otherEditorDraft.id;
  });

  const createContext = (userId: string, role: "ADMIN" | "EDITOR") => ({
    session: { user: { id: userId, role } },
  });

  // ============ createProject ============
  describe("createProject", () => {
    it("allows ADMIN", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await projectResolvers.Mutation.createProject(
        null,
        { input: { slug: "admin-create", titleEn: "Admin Create" } },
        ctx,
      );
      expect(result.id).toBeDefined();
      expect(result.status).toBe("DRAFT");
      expect(result.authorId).toBe(adminUserId);
    });

    it("allows EDITOR", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      const result = await projectResolvers.Mutation.createProject(
        null,
        { input: { slug: "editor-create", titleEn: "Editor Create" } },
        ctx,
      );
      expect(result.id).toBeDefined();
      expect(result.status).toBe("DRAFT");
      expect(result.authorId).toBe(editorUserId);
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "unauth-create", titleEn: "Unauth Create" } },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });
  });

  // ============ publishProject ============
  describe("publishProject", () => {
    it("allows ADMIN", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await projectResolvers.Mutation.publishProject(
        null,
        { id: editorDraftId },
        ctx,
      );
      expect(result.status).toBe("PUBLISHED");
    });

    it("rejects EDITOR", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      await expect(
        projectResolvers.Mutation.publishProject(null, { id: editorDraftId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        projectResolvers.Mutation.publishProject(null, { id: editorDraftId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });
  });

  // ============ deleteProject ============
  describe("deleteProject", () => {
    it("allows ADMIN to delete any project (including published)", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await projectResolvers.Mutation.deleteProject(
        null,
        { id: editorPublishedId },
        ctx,
      );
      expect(result).toBe(true);
      const deleted = await prisma.project.findUnique({ where: { id: editorPublishedId } });
      expect(deleted).toBeNull();
    });

    it("allows EDITOR to delete their own unpublished draft", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      const result = await projectResolvers.Mutation.deleteProject(
        null,
        { id: editorDraftId },
        ctx,
      );
      expect(result).toBe(true);
      const deleted = await prisma.project.findUnique({ where: { id: editorDraftId } });
      expect(deleted).toBeNull();
    });

    it("rejects EDITOR deleting someone else's draft", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      await expect(
        projectResolvers.Mutation.deleteProject(null, { id: otherEditorDraftId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects EDITOR deleting a published project (even their own)", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      await expect(
        projectResolvers.Mutation.deleteProject(null, { id: editorPublishedId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        projectResolvers.Mutation.deleteProject(null, { id: editorDraftId }, ctx),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });
  });

  // ============ updateProject ============
  describe("updateProject", () => {
    it("allows ADMIN to update any project", async () => {
      const ctx = createContext(adminUserId, "ADMIN");
      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: otherEditorDraftId, input: { slug: "other-editor-draft", titleEn: "Admin Updated" } },
        ctx,
      );
      expect(result.titleEn).toBe("Admin Updated");
    });

    it("allows EDITOR to update their own project", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: editorDraftId, input: { slug: "editor-draft", titleEn: "Editor Updated" } },
        ctx,
      );
      expect(result.titleEn).toBe("Editor Updated");
    });

    it("rejects EDITOR updating someone else's project", async () => {
      const ctx = createContext(editorUserId, "EDITOR");
      await expect(
        projectResolvers.Mutation.updateProject(
          null,
          { id: otherEditorDraftId, input: { titleEn: "Editor Updated" } },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("rejects unauthenticated", async () => {
      const ctx = { session: null };
      await expect(
        projectResolvers.Mutation.updateProject(
          null,
          { id: editorDraftId, input: { titleEn: "Unauth Updated" } },
          ctx,
        ),
      ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    // ============ shared Zod input validation (Article V single source) ============
    describe("input validation (shared schema)", () => {
      it("createProject rejects an empty slug with BAD_USER_INPUT", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        await expect(
          projectResolvers.Mutation.createProject(
            null,
            { input: { slug: "", titleEn: "No Slug" } },
            ctx,
          ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
      });

      it("createProject rejects a malformed liveUrl with BAD_USER_INPUT", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        await expect(
          projectResolvers.Mutation.createProject(
            null,
            { input: { slug: "bad-url-proj", liveUrl: "not-a-url" } },
            ctx,
          ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
      });

      it("createProject accepts a valid input including stack and persists it", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        const created = await projectResolvers.Mutation.createProject(
          null,
          {
            input: {
              slug: "valid-stack-proj",
              titleEn: "Valid Stack",
              stack: ["React", "GraphQL"],
              liveUrl: "https://example.com",
            },
          },
          ctx,
        );
        expect(created.slug).toBe("valid-stack-proj");
        expect(created.stack).toEqual(["React", "GraphQL"]);
      });

      it("createProject deduplicates slug when it already exists", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        await projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "dup-test", titleEn: "First" } },
          ctx,
        );
        const second = await projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "dup-test", titleEn: "Second" } },
          ctx,
        );
        expect(second.slug).toBe("dup-test-1");
      });

      it("createProject deduplicates slug with existing numeric suffix", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        await projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "dup-test", titleEn: "First" } },
          ctx,
        );
        await projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "dup-test", titleEn: "Second" } },
          ctx,
        );
        const third = await projectResolvers.Mutation.createProject(
          null,
          { input: { slug: "dup-test", titleEn: "Third" } },
          ctx,
        );
        expect(third.slug).toBe("dup-test-2");
      });

      it("updateProject rejects invalid input with BAD_USER_INPUT", async () => {
        const ctx = createContext(adminUserId, "ADMIN");
        await expect(
          projectResolvers.Mutation.updateProject(
            null,
            { id: adminProjectId, input: { slug: "admin-proj", liveUrl: "nope" } },
            ctx,
          ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
      });
    });
  });
});
