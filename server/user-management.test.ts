import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { bulkDeleteUsers, updateUserStatus, getAllUsers, getDb } from "./db";
import { users } from "../drizzle/schema";
import { like } from "drizzle-orm";

describe("User Management System", () => {
  let testUserIds: number[] = [];

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test users before each test
    await db.delete(users).where(like(users.email, "test-user-management-%"));

    // Create test users
    const testUsersData = [
      {
        email: "test-user-management-1@example.com",
        password: "password123",
        name: "Test User 1",
        role: "user" as const,
        status: "active" as const,
      },
      {
        email: "test-user-management-2@example.com",
        password: "password123",
        name: "Test User 2",
        role: "user" as const,
        status: "active" as const,
      },
      {
        email: "test-user-management-3@example.com",
        password: "password123",
        name: "Test User 3",
        role: "user" as const,
        status: "active" as const,
      },
    ];

    for (const userData of testUsersData) {
      const result = await db.insert(users).values(userData);
      testUserIds.push(Number((result as any)[0].insertId));
    }
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test users after each test
    await db.delete(users).where(like(users.email, "test-user-management-%"));
    testUserIds = [];
  });

  it("should suspend a user successfully", async () => {
    const userId = testUserIds[0];

    // Suspend user
    await updateUserStatus(userId, "suspended");

    // Verify user is suspended
    const allUsers = await getAllUsers();
    const suspendedUser = allUsers.find((u: any) => u.id === userId);
    expect(suspendedUser).toBeDefined();
    expect(suspendedUser?.status).toBe("suspended");
  });

  it("should activate a suspended user", async () => {
    const userId = testUserIds[0];

    // First suspend the user
    await updateUserStatus(userId, "suspended");

    // Then activate the user
    await updateUserStatus(userId, "active");

    // Verify user is active
    const allUsers = await getAllUsers();
    const activeUser = allUsers.find((u: any) => u.id === userId);
    expect(activeUser).toBeDefined();
    expect(activeUser?.status).toBe("active");
  });

  it("should bulk delete multiple users", async () => {
    const userIdsToDelete = [testUserIds[0], testUserIds[1]];

    // Bulk delete users
    await bulkDeleteUsers(userIdsToDelete);

    // Verify users are deleted
    const allUsers = await getAllUsers();
    const remainingTestUsers = allUsers.filter((u: any) =>
      testUserIds.includes(u.id)
    );

    expect(remainingTestUsers.length).toBe(1);
    expect(remainingTestUsers[0].id).toBe(testUserIds[2]);
  });

  it("should handle empty array in bulk delete", async () => {
    // Should not throw error with empty array
    await expect(bulkDeleteUsers([])).resolves.not.toThrow();

    // Verify all test users still exist
    const allUsers = await getAllUsers();
    const remainingTestUsers = allUsers.filter((u: any) =>
      testUserIds.includes(u.id)
    );
    expect(remainingTestUsers.length).toBe(3);
  });

  it("should get all users including status field", async () => {
    const allUsers = await getAllUsers();
    const testUsers = allUsers.filter((u: any) =>
      testUserIds.includes(u.id)
    );

    expect(testUsers.length).toBe(3);
    testUsers.forEach((user: any) => {
      expect(user).toHaveProperty("status");
      expect(user.status).toBe("active");
    });
  });
});
