import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createUser,
  bulkInsertTours,
  addFavorite,
  recordViewHistory,
  getRecommendations,
  getDb,
} from "./db";
import { users, agencies, tours, favorites, viewHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Recommendations System", () => {
  let testUserId: number;
  let testAgencyId: number;
  let testTourIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(favorites);
    await db.delete(viewHistory);
    await db.delete(tours);
    await db.delete(users).where(eq(users.email, "test-recommendations@example.com"));
    await db.delete(agencies).where(eq(agencies.name, "測試推薦旅行社"));

    // Create test user
    const userResult = await createUser({
      email: "test-recommendations@example.com",
      password: "password123",
      name: "測試推薦用戶",
    });
    testUserId = Number(userResult[0].insertId);

    // Create test agency
    const agencyResult = await db.insert(agencies).values({
      name: "測試推薦旅行社",
      description: "測試用旅行社",
      phone: "12345678",
    });
    testAgencyId = Number(agencyResult[0].insertId);

    // Create test tours with different destinations and types
    const testToursData = [
      {
        title: "日本東京5天團",
        destination: "日本",
        days: 5,
        nights: 4,
        price: "5000",
        departureDate: new Date("2024-06-01"),
        returnDate: new Date("2024-06-05"),
        agencyId: testAgencyId,
        tourType: "pure_play",
        itinerary: "測試行程",
        affiliateLink: "https://example.com/tour1",
        status: "active",
      },
      {
        title: "日本大阪6天團",
        destination: "日本",
        days: 6,
        nights: 5,
        price: "6000",
        departureDate: new Date("2024-06-15"),
        returnDate: new Date("2024-06-20"),
        agencyId: testAgencyId,
        tourType: "pure_play",
        itinerary: "測試行程",
        affiliateLink: "https://example.com/tour2",
        status: "active",
      },
      {
        title: "韓國首爾4天團",
        destination: "韓國",
        days: 4,
        nights: 3,
        price: "4000",
        departureDate: new Date("2024-07-01"),
        returnDate: new Date("2024-07-04"),
        agencyId: testAgencyId,
        tourType: "luxury",
        itinerary: "測試行程",
        affiliateLink: "https://example.com/tour3",
        status: "active",
      },
      {
        title: "泰國曼谷5天團",
        destination: "泰國",
        days: 5,
        nights: 4,
        price: "3500",
        departureDate: new Date("2024-07-15"),
        returnDate: new Date("2024-07-19"),
        agencyId: testAgencyId,
        tourType: "budget",
        itinerary: "測試行程",
        affiliateLink: "https://example.com/tour4",
        status: "active",
      },
      {
        title: "日本北海道7天團",
        destination: "日本",
        days: 7,
        nights: 6,
        price: "8000",
        departureDate: new Date("2024-08-01"),
        returnDate: new Date("2024-08-07"),
        agencyId: testAgencyId,
        tourType: "luxury",
        itinerary: "測試行程",
        affiliateLink: "https://example.com/tour5",
        status: "active",
      },
    ];

    await bulkInsertTours(testToursData);

    // Get inserted tour IDs
    const insertedTours = await db
      .select({ id: tours.id })
      .from(tours)
      .where(eq(tours.agencyId, testAgencyId));
    testTourIds = insertedTours.map(t => t.id);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(favorites).where(eq(favorites.userId, testUserId));
    await db.delete(viewHistory).where(eq(viewHistory.userId, testUserId));
    await db.delete(tours).where(eq(tours.agencyId, testAgencyId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(agencies).where(eq(agencies.id, testAgencyId));
  });

  it("should return popular tours when user has no history", async () => {
    const recommendations = await getRecommendations(testUserId, 10);
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    // Should return some tours (popular ones)
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("should recommend tours based on user favorites", async () => {
    // User favorites Japanese tours
    await addFavorite(testUserId, testTourIds[0]); // 日本東京
    await addFavorite(testUserId, testTourIds[1]); // 日本大阪

    const recommendations = await getRecommendations(testUserId, 10);
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    
    // Should recommend other Japanese tours (not already favorited)
    const japanTours = recommendations.filter((t: any) => t.destination === "日本");
    expect(japanTours.length).toBeGreaterThan(0);
    
    // Should not include already favorited tours
    const favoritedIds = [testTourIds[0], testTourIds[1]];
    const hasFavorited = recommendations.some((t: any) => favoritedIds.includes(t.id));
    expect(hasFavorited).toBe(false);
  });

  it("should recommend tours based on view history", async () => {
    // User views Korean tour
    await recordViewHistory(testUserId, testTourIds[2]); // 韓國首爾

    const recommendations = await getRecommendations(testUserId, 10);
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    
    // Should consider both favorites (Japan) and view history (Korea)
    // Recommendations should include tours from both destinations or similar types
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("should not recommend already viewed or favorited tours", async () => {
    const recommendations = await getRecommendations(testUserId, 10);
    
    // Get all user's favorited and viewed tour IDs
    const userInteractedIds = [testTourIds[0], testTourIds[1], testTourIds[2]];
    
    // None of the recommendations should be in the interacted list
    const hasInteracted = recommendations.some((t: any) => userInteractedIds.includes(t.id));
    expect(hasInteracted).toBe(false);
  });

  it("should limit recommendations to specified limit", async () => {
    const limit = 3;
    const recommendations = await getRecommendations(testUserId, limit);
    
    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeLessThanOrEqual(limit);
  });

  it("should include tour details in recommendations", async () => {
    const recommendations = await getRecommendations(testUserId, 5);
    
    if (recommendations.length > 0) {
      const tour = recommendations[0];
      
      // Check that all necessary fields are present
      expect(tour).toHaveProperty("id");
      expect(tour).toHaveProperty("title");
      expect(tour).toHaveProperty("destination");
      expect(tour).toHaveProperty("days");
      expect(tour).toHaveProperty("price");
      expect(tour).toHaveProperty("agencyName");
    }
  });
});
