/**
 * Test suite for remove duplicates functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { tours, agencies } from "../drizzle/schema";
import { removeDuplicateTours } from "./db";
import { eq } from "drizzle-orm";

describe("Remove Duplicates", () => {
  let testAgencyId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test agency
    const result = await db.insert(agencies).values({
      name: "測試旅行社",
      logo: null,
      whatsapp: null,
      phone: null,
    });

    testAgencyId = (result as any).insertId;
  });

  it("should remove duplicate tours based on destination, title, and agency name", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert 3 tours with same destination, title, and agency (duplicates)
    const tour1 = await db.insert(tours).values({
      title: "日本東京5日遊",
      destination: "日本",
      days: 5,
      nights: 4,
      price: "5000",
      originalPrice: null,
      departureDate: new Date("2025-02-01"),
      returnDate: new Date("2025-02-05"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour1",
      agencyId: testAgencyId,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "日本東京5日遊行程",
      affiliateLink: "https://example.com/affiliate1",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-01"),
    });

    // Wait 1 second to ensure different createdAt
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tour2 = await db.insert(tours).values({
      title: "日本東京5日遊",
      destination: "日本",
      days: 5,
      nights: 4,
      price: "5200",
      originalPrice: null,
      departureDate: new Date("2025-02-05"),
      returnDate: new Date("2025-02-09"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour2",
      agencyId: testAgencyId,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "日本東京5日遊行程",
      affiliateLink: "https://example.com/affiliate2",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-02"),
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const tour3 = await db.insert(tours).values({
      title: "日本東京5日遊",
      destination: "日本",
      days: 5,
      nights: 4,
      price: "5300",
      originalPrice: null,
      departureDate: new Date("2025-02-10"),
      returnDate: new Date("2025-02-14"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour3",
      agencyId: testAgencyId,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "日本東京5日遊行程",
      affiliateLink: "https://example.com/affiliate3",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-03"), // Most recent
    });

    // Insert a different tour (not a duplicate)
    const tour4 = await db.insert(tours).values({
      title: "韓國首爾4日遊",
      destination: "韓國",
      days: 4,
      nights: 3,
      price: "4000",
      originalPrice: null,
      departureDate: new Date("2025-02-01"),
      returnDate: new Date("2025-02-04"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour4",
      agencyId: testAgencyId,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "韓國首爾4日遊行程",
      affiliateLink: "https://example.com/affiliate4",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-01"),
    });

    // Run remove duplicates
    const deletedCount = await removeDuplicateTours();

    // Should delete 2 tours (keep the most recent one)
    expect(deletedCount).toBe(2);

    // Verify that only the most recent tour remains
    const remainingTours = await db
      .select()
      .from(tours)
      .where(eq(tours.title, "日本東京5日遊"));

    expect(remainingTours.length).toBe(1);
    expect(remainingTours[0].price).toBe("5300"); // Most recent tour

    // Verify that the different tour is not deleted
    const koreanTour = await db
      .select()
      .from(tours)
      .where(eq(tours.title, "韓國首爾4日遊"));

    expect(koreanTour.length).toBe(1);

    // Cleanup
    await db.delete(tours).where(eq(tours.agencyId, testAgencyId));
    await db.delete(agencies).where(eq(agencies.id, testAgencyId));
  });

  it("should not delete tours if there are no duplicates", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new test agency for this test
    const agencyResult = await db.insert(agencies).values({
      name: "測試旅行社2",
      logo: null,
      whatsapp: null,
      phone: null,
    });
    const testAgencyId2 = (agencyResult as any).insertId;

    // Insert 2 different tours (no duplicates)
    await db.insert(tours).values({
      title: "泰國曼谷5日遊",
      destination: "泰國",
      days: 5,
      nights: 4,
      price: "3000",
      originalPrice: null,
      departureDate: new Date("2025-02-01"),
      returnDate: new Date("2025-02-05"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour5",
      agencyId: testAgencyId2,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "泰國曼谷5日遊行程",
      affiliateLink: "https://example.com/affiliate5",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-01"),
    });

    await db.insert(tours).values({
      title: "新加坡3日遊",
      destination: "新加坡",
      days: 3,
      nights: 2,
      price: "2500",
      originalPrice: null,
      departureDate: new Date("2025-02-01"),
      returnDate: new Date("2025-02-03"),
      imageUrl: null,
      sourceUrl: "https://example.com/tour6",
      agencyId: testAgencyId2,
      status: "active",
      rating: "4.5",
      reviewCount: 10,
      isNoShopping: false,
      isVerified: false,
      tourType: "pure_play",
      highlights: null,
      itinerary: "新加坡3日遊行程",
      affiliateLink: "https://example.com/affiliate6",
      inclusions: null,
      exclusions: null,
      notes: null,
      createdAt: new Date("2025-01-01"),
    });

    // Run remove duplicates
    const deletedCount = await removeDuplicateTours();

    // Should not delete any tours
    expect(deletedCount).toBe(0);

    // Cleanup
    await db.delete(tours).where(eq(tours.agencyId, testAgencyId2));
    await db.delete(agencies).where(eq(agencies.id, testAgencyId2));
  });
});
