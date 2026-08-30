/// <reference types="vitest/globals" />
import { resolveLocalizedField, getPublicProjects } from "./service";
import { prisma } from "@/lib/prisma";

describe("resolveLocalizedField", () => {
  it("returns primary locale when available", () => {
    const result = resolveLocalizedField("Hello", null, "EN");
    expect(result).toEqual({ value: "Hello", locale: "EN", localeFallback: false });
  });

  it("returns primary locale when available (AR)", () => {
    const result = resolveLocalizedField(null, "مرحبا", "AR");
    expect(result).toEqual({ value: "مرحبا", locale: "AR", localeFallback: false });
  });

  it("falls back to other locale when primary is null (EN->AR)", () => {
    const result = resolveLocalizedField(null, "مرحبا", "EN");
    expect(result).toEqual({ value: "مرحبا", locale: "AR", localeFallback: true });
  });

  it("falls back to other locale when primary is null (AR->EN)", () => {
    const result = resolveLocalizedField("Hello", null, "AR");
    expect(result).toEqual({ value: "Hello", locale: "EN", localeFallback: true });
  });

  it("returns empty when both locales are null", () => {
    const result = resolveLocalizedField(null, null, "EN");
    expect(result).toEqual({ value: "", locale: "EN", localeFallback: false });
  });

  it("returns empty string not null when both missing", () => {
    const result = resolveLocalizedField("", "", "EN");
    expect(result.value).toBe("");
  });
});

describe("getPublicProjects", () => {
  let adminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    adminUserId = admin!.id;
  });

  beforeEach(async () => {
    await prisma.project.deleteMany();
    await prisma.tag.deleteMany();
  });

  it("returns only PUBLISHED projects regardless of status arg", async () => {
    await prisma.project.create({
      data: {
        slug: "svc-test-published-1",
        titleEn: "Pub 1",
        status: "PUBLISHED",
        authorId: adminUserId,
      },
    });
    await prisma.project.create({
      data: {
        slug: "svc-test-draft-1",
        titleEn: "Draft 1",
        status: "DRAFT",
        authorId: adminUserId,
      },
    });
    await prisma.project.create({
      data: {
        slug: "svc-test-published-2",
        titleEn: "Pub 2",
        status: "PUBLISHED",
        authorId: adminUserId,
      },
    });

    const result = await getPublicProjects();

    expect(result).toHaveLength(2);
    result.forEach((p) => expect(p.status).toBe("PUBLISHED"));
  });

  it("returns empty when no PUBLISHED projects exist", async () => {
    await prisma.project.create({
      data: {
        slug: "svc-test-draft-only",
        titleEn: "Draft 1",
        status: "DRAFT",
        authorId: adminUserId,
      },
    });

    const result = await getPublicProjects();

    expect(result).toHaveLength(0);
  });

  it("includes tags relation", async () => {
    const tag = await prisma.tag.create({ data: { name: "svc-test-react" } });
    await prisma.project.create({
      data: {
        slug: "svc-test-pub-tagged",
        titleEn: "Tagged",
        status: "PUBLISHED",
        authorId: adminUserId,
        tags: { connect: { id: tag.id } },
      },
    });

    const result = await getPublicProjects();

    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].name).toBe("svc-test-react");
  });
});
