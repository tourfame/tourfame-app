import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getFeaturedTours, getDb } from "./db";
import { tours, agencies } from "../drizzle/schema";
import { like, inArray } from "drizzle-orm";

describe("Featured Tours System", () => {
  let testTourIds: number[] = [];
  let testAgencyId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(tours).where(like(tours.title, "test-featured-%"));
    await db.delete(agencies).where(like(agencies.name, "Test Featured Agency%"));

    // Create test agency
    const agencyResult = await db.insert(agencies).values({
      name: "Test Featured Agency",
      website: "https://test-featured.com",
      email: "test@featured.com",
    });
    testAgencyId = Number((agencyResult as any)[0].insertId);

    // Create 10 test tours
    for (let i = 1; i <= 10; i++) {
      const tourResult = await db.insert(tours).values({
        title: `test-featured-tour-${i}`,
        destination: `Test Destination ${i}`,
        days: 5,
        nights: 4,
        price: "5000",
        departureDate: new Date("2026-06-01"),
        returnDate: new Date("2026-06-05"),
        availableSeats: 20,
        tourType: "pure_play",
        status: "active",
        agencyId: testAgencyId,
        itinerary: "Test itinerary",
        affiliateLink: "https://test.com",
      });
      testTourIds.push(Number((tourResult as any)[0].insertId));
    }
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(tours).where(like(tours.title, "test-featured-%"));
    await db.delete(agencies).where(like(agencies.name, "Test Featured Agency%"));
    testTourIds = [];
  });

  it("should return 5 featured tours by default", async () => {
    const featured = await getFeaturedTours();
    
    expect(featured.length).toBe(5);
  });

  it("should return all tours if fewer than requested limit", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Delete some tours to have only 3
    await db.delete(tours).where(inArray(tours.id, testTourIds.slice(3)));

    const featured = await getFeaturedTours(5);
    
    expect(featured.length).toBe(3);
  });

  it("should return consistent results on the same day", async () => {
    // Call getFeaturedTours multiple times
    const result1 = await getFeaturedTours(5);
    const result2 = await getFeaturedTours(5);
    const result3 = await getFeaturedTours(5);

    // All results should be identical (same order, same tours)
    expect(result1.map(t => t.id)).toEqual(result2.map(t => t.id));
    expect(result2.map(t => t.id)).toEqual(result3.map(t => t.id));
  });

  it("should only return active tours", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Set some tours to draft (inactive)
    await db.update(tours)
      .set({ status: "draft" })
      .where(inArray(tours.id, testTourIds.slice(0, 5)));

    const featured = await getFeaturedTours(10);
    
    // Should only return the 5 active tours
    expect(featured.length).toBe(5);
    featured.forEach(tour => {
      expect(tour.status).toBe("active");
    });
  });

  it("should include agency information", async () => {
    const featured = await getFeaturedTours(5);
    
    featured.forEach(tour => {
      expect(tour).toHaveProperty("agencyName");
      expect(tour.agencyName).toBe("Test Featured Agency");
      expect(tour).toHaveProperty("agencyId");
      expect(tour.agencyId).toBe(testAgencyId);
    });
  });

  it("should respect custom limit parameter", async () => {
    const featured3 = await getFeaturedTours(3);
    const featured7 = await getFeaturedTours(7);
    
    expect(featured3.length).toBe(3);
    expect(featured7.length).toBe(7);
  });
});
