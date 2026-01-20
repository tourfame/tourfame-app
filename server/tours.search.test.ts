import { describe, it, expect } from "vitest";
import { searchTours } from "./db";

describe("tours.search", () => {
  it("should search tours by keyword", async () => {
    const result = await searchTours({ keyword: "巴爾幹", limit: 10 });
    
    expect(result).toBeDefined();
    expect(result.tours).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
    
    console.log(`Found ${result.total} tours`);
    if (result.tours.length > 0) {
      console.log("First tour:", result.tours[0].title);
    }
  });

  it("should search tours by price range", async () => {
    const result = await searchTours({ 
      minPrice: 0, 
      maxPrice: 10000, 
      limit: 10 
    });
    
    expect(result).toBeDefined();
    expect(result.tours).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
    
    console.log(`Found ${result.total} tours in price range 0-10000`);
  });

  it("should return all tours when no filters", async () => {
    const result = await searchTours({ limit: 100 });
    
    expect(result).toBeDefined();
    expect(result.tours).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
    
    console.log(`Found ${result.total} total tours`);
  });
});
