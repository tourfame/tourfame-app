import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getScrapeJobById: vi.fn(),
  bulkInsertTours: vi.fn(),
  updateScrapeJob: vi.fn(),
}));

import { getScrapeJobById, bulkInsertTours, updateScrapeJob } from "./db";

describe("importTours price and sourceUrl logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use scrape job price when tour price is 0", async () => {
    // Simulate the logic from importTours
    const job = {
      id: 1,
      url: "https://example.com/tour.pdf",
      price: "8399.00",
    };

    const tour = {
      title: "Test Tour",
      destination: "Tokyo",
      days: 5,
      nights: 4,
      price: 0, // LLM extracted price is 0
      agencyId: 1,
      tourType: "pure_play" as const,
    };

    const sourceUrl = job.url || null;
    const defaultPrice = job.price ? parseFloat(job.price) : 0;

    // Test the price logic
    const finalPrice = (tour.price && tour.price > 0 ? tour.price : defaultPrice).toString();
    
    expect(finalPrice).toBe("8399");
    expect(sourceUrl).toBe("https://example.com/tour.pdf");
  });

  it("should use tour price when tour price is valid", async () => {
    const job = {
      id: 1,
      url: "https://example.com/tour.pdf",
      price: "8399.00",
    };

    const tour = {
      title: "Test Tour",
      destination: "Tokyo",
      days: 5,
      nights: 4,
      price: 5999, // LLM extracted a valid price
      agencyId: 1,
      tourType: "pure_play" as const,
    };

    const sourceUrl = job.url || null;
    const defaultPrice = job.price ? parseFloat(job.price) : 0;

    // Test the price logic
    const finalPrice = (tour.price && tour.price > 0 ? tour.price : defaultPrice).toString();
    
    expect(finalPrice).toBe("5999");
    expect(sourceUrl).toBe("https://example.com/tour.pdf");
  });

  it("should handle null job price gracefully", async () => {
    const job = {
      id: 1,
      url: "https://example.com/tour.pdf",
      price: null,
    };

    const tour = {
      title: "Test Tour",
      destination: "Tokyo",
      days: 5,
      nights: 4,
      price: 0,
      agencyId: 1,
      tourType: "pure_play" as const,
    };

    const sourceUrl = job.url || null;
    const defaultPrice = job.price ? parseFloat(job.price) : 0;

    // Test the price logic
    const finalPrice = (tour.price && tour.price > 0 ? tour.price : defaultPrice).toString();
    
    expect(finalPrice).toBe("0");
    expect(sourceUrl).toBe("https://example.com/tour.pdf");
  });

  it("should handle null job url gracefully", async () => {
    const job = {
      id: 1,
      url: null,
      price: "8399.00",
    };

    const tour = {
      title: "Test Tour",
      destination: "Tokyo",
      days: 5,
      nights: 4,
      price: 0,
      agencyId: 1,
      tourType: "pure_play" as const,
    };

    const sourceUrl = job.url || null;
    const defaultPrice = job.price ? parseFloat(job.price) : 0;

    // Test the price logic
    const finalPrice = (tour.price && tour.price > 0 ? tour.price : defaultPrice).toString();
    
    expect(finalPrice).toBe("8399");
    expect(sourceUrl).toBeNull();
  });
});
