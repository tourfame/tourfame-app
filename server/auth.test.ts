import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth API", () => {
  it("should register a new user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `test${Date.now()}@example.com`;

    const result = await caller.auth.register({
      email: testEmail,
      password: "password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
    expect(result.user?.name).toBe("Test User");
    expect(result.user?.role).toBe("user");
  });

  it("should reject duplicate email registration", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `duplicate${Date.now()}@example.com`;

    // First registration
    await caller.auth.register({
      email: testEmail,
      password: "password123",
    });

    // Second registration with same email should fail
    await expect(
      caller.auth.register({
        email: testEmail,
        password: "password456",
      })
    ).rejects.toThrow("此電郵已被註冊");
  });

  it("should login with correct credentials", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `login${Date.now()}@example.com`;
    const password = "password123";

    // Register first
    await caller.auth.register({
      email: testEmail,
      password,
    });

    // Login
    const result = await caller.auth.login({
      email: testEmail,
      password,
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
  });

  it("should reject login with wrong password", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `wrongpass${Date.now()}@example.com`;

    // Register first
    await caller.auth.register({
      email: testEmail,
      password: "correctpassword",
    });

    // Try to login with wrong password
    await expect(
      caller.auth.login({
        email: testEmail,
        password: "wrongpassword",
      })
    ).rejects.toThrow("電郵或密碼錯誤");
  });

  it("should reject login with non-existent email", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "password123",
      })
    ).rejects.toThrow("電郵或密碼錯誤");
  });

  it("should return null for me query when not authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
