import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tours API", () => {
  it("should fetch featured tours", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.getFeatured({ limit: 6 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Since database might be empty, we just check the structure
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("destination");
      expect(result[0]).toHaveProperty("price");
    }
  });

  it("should fetch no shopping tours", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.getNoShopping({ limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // All returned tours should have isNoShopping = true
    result.forEach((tour) => {
      expect(tour.isNoShopping).toBe(true);
    });
  });

  it("should search tours with filters", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.search({
      destination: "日本",
      sortBy: "rating",
      limit: 20,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("tours");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.tours)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("should search tours with price range filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.search({
      minPrice: 5000,
      maxPrice: 10000,
      sortBy: "price_asc",
      limit: 20,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result.tours).toBeDefined();
    // All returned tours should be within price range
    result.tours.forEach((tour) => {
      const price = parseFloat(tour.price);
      expect(price).toBeGreaterThanOrEqual(5000);
      expect(price).toBeLessThanOrEqual(10000);
    });
  });

  it("should search tours with tour type filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.search({
      tourType: "pure_play",
      limit: 20,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result.tours).toBeDefined();
    // All returned tours should be pure_play type
    result.tours.forEach((tour) => {
      expect(tour.tourType).toBe("pure_play");
    });
  });

  it("should handle invalid tour ID gracefully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.tours.getById({ id: 999999 })
    ).rejects.toThrow("Tour not found");
  });

  it("should fetch all agencies", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tours.getAgencies();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    }
  });
});
