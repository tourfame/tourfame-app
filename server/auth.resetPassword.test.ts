import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { db, getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Password Reset Flow", () => {
  let testUserId: number;
  const testEmail = `test-reset-${Date.now()}@example.com`;
  const testPassword = "oldpassword123";
  let resetToken: string;

  beforeAll(async () => {
    // Create a test user
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Register test user
    const result = await caller.auth.register({
      email: testEmail,
      password: testPassword,
      name: "Test User",
    });

    testUserId = result.user!.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance.delete(users).where(eq(users.id, testUserId));
      }
    }
  });

  it("should send password reset email", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.forgotPassword({
      email: testEmail,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("重設密碼連結");

    // Verify reset token was stored
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    
    const user = await dbInstance
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user[0].resetToken).toBeTruthy();
    expect(user[0].resetTokenExpiry).toBeTruthy();
    
    // Store token for next test
    resetToken = user[0].resetToken!;
  });

  it("should reset password with valid token", async () => {
    // Skip if no token from previous test
    if (!resetToken) {
      console.warn("Skipping test: no reset token available");
      return;
    }
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const newPassword = "newpassword456";

    const result = await caller.auth.resetPassword({
      token: resetToken,
      newPassword: newPassword,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("密碼重設成功");
    expect(result.user).toBeTruthy();

    // Verify reset token was cleared
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    
    const user = await dbInstance
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user[0].resetToken).toBeNull();
    expect(user[0].resetTokenExpiry).toBeNull();

    // Verify can login with new password
    const loginResult = await caller.auth.login({
      email: testEmail,
      password: newPassword,
    });

    expect(loginResult.success).toBe(true);
  });

  it("should reject invalid reset token", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.resetPassword({
        token: "invalid-token-12345",
        newPassword: "newpassword789",
      })
    ).rejects.toThrow("重設連結無效或已過期");
  });

  it("should return success for non-existent email (security)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.forgotPassword({
      email: "nonexistent@example.com",
    });

    // Should return success to prevent email enumeration
    expect(result.success).toBe(true);
    expect(result.message).toContain("重設密碼連結");
  });
});
