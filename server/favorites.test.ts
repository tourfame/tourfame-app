import { describe, it, expect, beforeAll } from "vitest";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkIsFavorited,
  recordViewHistory,
  getUserViewHistory,
} from "./db";

describe("Favorites and View History", () => {
  let testUserId: number;
  let testTourId: number;

  beforeAll(async () => {
    // Assume test user and tour exist in database
    testUserId = 1;
    testTourId = 1;
  });

  describe("Favorites", () => {
    it("should add a tour to favorites", async () => {
      const favoriteId = await addFavorite(testUserId, testTourId);
      expect(favoriteId).toBeDefined();
    });

    it("should check if a tour is favorited", async () => {
      const isFavorited = await checkIsFavorited(testUserId, testTourId);
      expect(isFavorited).toBe(true);
    });

    it("should get user favorites", async () => {
      const favorites = await getUserFavorites(testUserId);
      expect(favorites).toBeDefined();
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
    });

    it("should remove a tour from favorites", async () => {
      await removeFavorite(testUserId, testTourId);
      const isFavorited = await checkIsFavorited(testUserId, testTourId);
      expect(isFavorited).toBe(false);
    });
  });

  describe("View History", () => {
    it("should record view history", async () => {
      const viewId = await recordViewHistory(testUserId, testTourId);
      expect(viewId).toBeDefined();
    });

    it("should get user view history", async () => {
      const history = await getUserViewHistory(testUserId, 10);
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
