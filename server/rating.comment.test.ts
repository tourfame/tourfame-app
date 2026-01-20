import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createUser, bulkInsertTours, createRating, getTourRatings, createComment, getTourComments, deleteComment, getAllAgencies, getAllTours } from "./db";

describe("Rating and Comment System", () => {
  let testUserId: number;
  let testAgencyId: number;
  let testTourId: number;
  let testCommentId: number;

  beforeAll(async () => {
    // Create test user
    const userResult = await createUser({
      email: `test-rating-${Date.now()}@example.com`,
      password: "password123",
      name: "Test User",
    });
    testUserId = userResult[0].insertId;

    // Get an existing agency
    const agencies = await getAllAgencies();
    if (agencies.length === 0) {
      throw new Error("No agencies found in database. Please add at least one agency first.");
    }
    testAgencyId = agencies[0].id;

    // Create test tour using bulkInsertTours
    await bulkInsertTours([{
      agencyId: testAgencyId,
      title: "Test Tour for Rating",
      destination: "Tokyo",
      days: 5,
      nights: 4,
      tourType: "pure_play",
      price: "5000",
      currency: "HKD",
      departureDate: new Date("2026-06-01"),
      returnDate: new Date("2026-06-05"),
      availableSeats: 20,
      minGroupSize: 10,
      itinerary: "Test itinerary",
      affiliateLink: "https://example.com/tour",
      status: "active",
    }]);
    
    // Get the created tour ID
    const tours = await getAllTours({ limit: 1 });
    testTourId = tours[0].id;
  });

  it("should create a rating", async () => {
    const ratingId = await createRating({
      tourId: testTourId,
      userId: testUserId,
      rating: 5,
    });
    expect(ratingId).toBeGreaterThan(0);
  });

  it("should get tour ratings", async () => {
    const ratings = await getTourRatings(testTourId);
    expect(ratings.length).toBeGreaterThan(0);
    expect(ratings[0].rating).toBe(5);
  });

  it("should update existing rating", async () => {
    // Create initial rating
    await createRating({
      tourId: testTourId,
      userId: testUserId,
      rating: 4,
    });

    // Update to 5 stars
    await createRating({
      tourId: testTourId,
      userId: testUserId,
      rating: 5,
    });

    const ratings = await getTourRatings(testTourId);
    // Find rating by checking if email contains 'test-rating'
    const userRating = ratings.find((r) => r.userEmail?.includes('test-rating'));
    expect(userRating?.rating).toBe(5);
  });

  it("should create a comment", async () => {
    testCommentId = await createComment({
      tourId: testTourId,
      userId: testUserId,
      content: "This is a test comment",
    });
    expect(testCommentId).toBeGreaterThan(0);
  });

  it("should get tour comments", async () => {
    const comments = await getTourComments(testTourId);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0].content).toBe("This is a test comment");
  });

  it("should delete a comment", async () => {
    await deleteComment(testCommentId, testUserId);
    const comments = await getTourComments(testTourId);
    const deletedComment = comments.find((c) => c.id === testCommentId);
    expect(deletedComment).toBeUndefined();
  });

  it("should not allow deleting other user's comment", async () => {
    // Create a comment
    const commentId = await createComment({
      tourId: testTourId,
      userId: testUserId,
      content: "Another test comment",
    });

    // Try to delete with different user ID
    const fakeUserId = 99999;
    await deleteComment(commentId, fakeUserId);

    // Comment should still exist
    const comments = await getTourComments(testTourId);
    const comment = comments.find((c) => c.id === commentId);
    expect(comment).toBeDefined();
  });
});
