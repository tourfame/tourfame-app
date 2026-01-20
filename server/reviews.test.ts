import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createReview,
  getTourReviews,
  getUserReviews,
  deleteReview,
  markReviewHelpful,
  createComment,
  getTourComments,
  deleteComment,
} from "./db";

describe("Reviews and Comments API", () => {
  let testTourId = 1;
  let testUserId = 1;
  let testReviewId: number;
  let testCommentId: number;

  describe("Reviews", () => {
    it("should create a review", async () => {
      const reviewId = await createReview({
        tourId: testTourId,
        userId: testUserId,
        rating: 5,
        title: "測試評價標題",
        content: "這是一個測試評價內容，體驗非常棒！",
        travelDate: new Date("2024-01-01"),
      });

      expect(reviewId).toBeTypeOf("number");
      expect(reviewId).toBeGreaterThan(0);
      testReviewId = reviewId;
    });

    it("should get tour reviews", async () => {
      const reviews = await getTourReviews(testTourId);

      expect(Array.isArray(reviews)).toBe(true);
      if (reviews.length > 0) {
        const review = reviews[0];
        expect(review).toHaveProperty("id");
        expect(review).toHaveProperty("rating");
        expect(review).toHaveProperty("content");
        expect(review).toHaveProperty("userName");
      }
    });

    it("should get user reviews", async () => {
      const reviews = await getUserReviews(testUserId);

      expect(Array.isArray(reviews)).toBe(true);
      if (reviews.length > 0) {
        const review = reviews[0];
        expect(review).toHaveProperty("id");
        expect(review).toHaveProperty("tourTitle");
        expect(review).toHaveProperty("rating");
      }
    });

    it("should mark review as helpful", async () => {
      await markReviewHelpful(testReviewId);

      const reviews = await getTourReviews(testTourId);
      const review = reviews.find((r) => r.id === testReviewId);

      expect(review).toBeDefined();
      expect(review!.helpfulCount).toBeGreaterThan(0);
    });

    it("should delete a review", async () => {
      await deleteReview(testReviewId, testUserId);

      const reviews = await getTourReviews(testTourId);
      const deletedReview = reviews.find((r) => r.id === testReviewId);

      expect(deletedReview).toBeUndefined();
    });
  });

  describe("Comments", () => {
    it("should create a comment", async () => {
      const commentId = await createComment({
        tourId: testTourId,
        userId: testUserId,
        content: "這是一個測試留言",
      });

      expect(commentId).toBeTypeOf("number");
      expect(commentId).toBeGreaterThan(0);
      testCommentId = commentId;
    });

    it("should get tour comments", async () => {
      const comments = await getTourComments(testTourId);

      expect(Array.isArray(comments)).toBe(true);
      if (comments.length > 0) {
        const comment = comments[0];
        expect(comment).toHaveProperty("id");
        expect(comment).toHaveProperty("content");
        expect(comment).toHaveProperty("userName");
        expect(comment).toHaveProperty("createdAt");
      }
    });

    it("should delete a comment", async () => {
      await deleteComment(testCommentId, testUserId);

      const comments = await getTourComments(testTourId);
      const deletedComment = comments.find((c) => c.id === testCommentId);

      expect(deletedComment).toBeUndefined();
    });
  });
});
