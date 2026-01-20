import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createUser, createRating, createComment, getTourRatings, getTourComments, deleteComment } from "./db";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

describe("Ratings and Comments API", () => {
  let testUserId: number;
  let testTourId: number;

  beforeAll(async () => {
    // Create a test user
    const userResult = await createUser({
      email: `test-ratings-${Date.now()}@example.com`,
      password: "password123",
      name: "Test User",
    });
    testUserId = Number(userResult[0].insertId);

    // Get an existing tour from database
    const { searchTours } = await import("./db");
    const tours = await searchTours({});
    if (tours.length === 0) {
      console.warn("No tours found in database, skipping tests");
      testTourId = 0;
    } else {
      testTourId = tours[0].id;
    }
  });

  describe("Ratings", () => {
    it("should create a rating", async () => {
      const ratingId = await createRating({
        tourId: testTourId,
        userId: testUserId,
        rating: 5,
      });
      expect(ratingId).toBeGreaterThan(0);
    });

    it("should update existing rating", async () => {
      // Create initial rating
      await createRating({
        tourId: testTourId,
        userId: testUserId,
        rating: 3,
      });

      // Update rating (same user, same tour)
      const ratingId = await createRating({
        tourId: testTourId,
        userId: testUserId,
        rating: 5,
      });

      expect(ratingId).toBeGreaterThan(0);

      // Verify rating was updated
      const ratings = await getTourRatings(testTourId);
      const userRating = ratings.find((r) => r.userName === "Test User");
      expect(userRating?.rating).toBe(5);
    });

    it("should get tour ratings", async () => {
      const ratings = await getTourRatings(testTourId);
      expect(Array.isArray(ratings)).toBe(true);
      expect(ratings.length).toBeGreaterThan(0);
    });
  });

  describe("Comments", () => {
    let testCommentId: number;

    it("should create a comment", async () => {
      const commentId = await createComment({
        tourId: testTourId,
        userId: testUserId,
        content: "This is a test comment",
      });
      testCommentId = commentId;
      expect(commentId).toBeGreaterThan(0);
    });

    it("should get tour comments", async () => {
      const comments = await getTourComments(testTourId);
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);
      
      const testComment = comments.find((c) => c.id === testCommentId);
      expect(testComment?.content).toBe("This is a test comment");
    });

    it("should delete own comment", async () => {
      await deleteComment(testCommentId, testUserId);
      
      const comments = await getTourComments(testTourId);
      const deletedComment = comments.find((c) => c.id === testCommentId);
      expect(deletedComment).toBeUndefined();
    });

    it("should not delete other user's comment", async () => {
      // Create a comment
      const commentId = await createComment({
        tourId: testTourId,
        userId: testUserId,
        content: "Another test comment",
      });

      // Try to delete with wrong user ID
      await deleteComment(commentId, 99999);

      // Verify comment still exists
      const comments = await getTourComments(testTourId);
      const comment = comments.find((c) => c.id === commentId);
      expect(comment).toBeDefined();

      // Clean up
      await deleteComment(commentId, testUserId);
    });
  });

  describe("tRPC Endpoints", () => {
    it("should require authentication for createRating", async () => {
      const caller = createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });
      
      await expect(
        caller.tours.createRating({
          tourId: testTourId,
          rating: 5,
        })
      ).rejects.toThrow("請先登入再評分");
    });

    it("should require authentication for createComment", async () => {
      const caller = createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });
      
      await expect(
        caller.tours.createComment({
          tourId: testTourId,
          content: "Test comment",
        })
      ).rejects.toThrow("請先登入再留言");
    });

    it("should create rating with authentication", async () => {
      const caller = createCaller({
        user: {
          id: testUserId,
          openId: "test-openid",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "email",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.tours.createRating({
        tourId: testTourId,
        rating: 4,
      });

      expect(result.success).toBe(true);
      expect(result.ratingId).toBeGreaterThan(0);
    });

    it("should create comment with authentication", async () => {
      const caller = createCaller({
        user: {
          id: testUserId,
          openId: "test-openid",
          email: "test@example.com",
          name: "Test User",
          loginMethod: "email",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.tours.createComment({
        tourId: testTourId,
        content: "Test comment via tRPC",
      });

      expect(result.success).toBe(true);
      expect(result.commentId).toBeGreaterThan(0);
    });

    it("should get ratings without authentication", async () => {
      const caller = createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });
      
      const ratings = await caller.tours.getTourRatings({
        tourId: testTourId,
      });

      expect(Array.isArray(ratings)).toBe(true);
    });

    it("should get comments without authentication", async () => {
      const caller = createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });
      
      const comments = await caller.tours.getTourComments({
        tourId: testTourId,
      });

      expect(Array.isArray(comments)).toBe(true);
    });
  });
});
