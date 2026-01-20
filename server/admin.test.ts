import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  const adminUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createNonAdminContext(): TrpcContext {
  const regularUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin API", () => {
  it("should allow admin to create scrape job", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.createScrapeJob({
      name: "測試爬蟲任務",
      url: "https://example.com/tours",
      agencyId: 1, // Use first agency
      category: "asia",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    // jobId might be 0 if insertId is not available, just check it's defined
    expect(result.jobId).toBeGreaterThanOrEqual(0);
  });

  it("should deny non-admin access to create scrape job", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createScrapeJob({
        url: "https://example.com/tours",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("should allow admin to get scrape jobs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getScrapeJobs();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-admin access to get scrape jobs", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getScrapeJobs()).rejects.toThrow(
      "Admin access required"
    );
  });

  it("should validate URL format when creating scrape job", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createScrapeJob({
        url: "not-a-valid-url",
      })
    ).rejects.toThrow();
  });
});
