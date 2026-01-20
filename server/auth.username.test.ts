import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: {
        "x-forwarded-proto": "https",
      },
      protocol: "https",
    } as any,
    res: {
      cookie: () => {},
    } as any,
  };
}

describe("Username Uniqueness", () => {
  it("should prevent duplicate usernames", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail1 = `test${Date.now()}@example.com`;
    const testEmail2 = `test${Date.now() + 1}@example.com`;
    const testUsername = `testuser${Date.now()}`;

    // First registration with username
    await caller.auth.register({
      email: testEmail1,
      password: "password123",
      name: testUsername,
    });

    // Second registration with same username should fail
    await expect(
      caller.auth.register({
        email: testEmail2,
        password: "password456",
        name: testUsername,
      })
    ).rejects.toThrow("此用戶名稱已被使用，請選擇其他名稱");
  });

  it("should allow registration with different usernames", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail1 = `test${Date.now()}@example.com`;
    const testEmail2 = `test${Date.now() + 1}@example.com`;
    const testUsername1 = `testuser${Date.now()}`;
    const testUsername2 = `testuser${Date.now() + 1}`;

    // First registration
    const result1 = await caller.auth.register({
      email: testEmail1,
      password: "password123",
      name: testUsername1,
    });

    expect(result1).toBeDefined();
    expect(result1.user.name).toBe(testUsername1);

    // Second registration with different username should succeed
    const result2 = await caller.auth.register({
      email: testEmail2,
      password: "password456",
      name: testUsername2,
    });

    expect(result2).toBeDefined();
    expect(result2.user.name).toBe(testUsername2);
  });

  it("should allow registration without username", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `test${Date.now()}@example.com`;

    // Registration without username should succeed
    const result = await caller.auth.register({
      email: testEmail,
      password: "password123",
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe(testEmail);
  });
});
