import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { agencies, tours } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("importExtractedTours", () => {
  let db: any;
  let testAgencyId: number;

  beforeAll(async () => {
    db = await getDb();
    
    // 清理測試數據
    await db.delete(tours).where(eq(tours.title, "測試旅行團 - 日本東京"));
    await db.delete(agencies).where(eq(agencies.name, "其他"));
    await db.delete(agencies).where(eq(agencies.name, "捷旅"));
  });

  afterAll(async () => {
    // 清理測試數據
    await db.delete(tours).where(eq(tours.title, "測試旅行團 - 日本東京"));
    await db.delete(tours).where(eq(tours.title, "測試旅行團 - 韓國首爾"));
    await db.delete(tours).where(eq(tours.title, "測試旅行團 - 捷克布拉格"));
    await db.delete(agencies).where(eq(agencies.name, "其他"));
    await db.delete(agencies).where(eq(agencies.name, "捷旅"));
  });

  it("應該自動創建「其他」旅行社", async () => {
    // 確認「其他」旅行社不存在
    const before = await db.select().from(agencies).where(eq(agencies.name, "其他"));
    expect(before.length).toBe(0);

    // 模擬導入旅行團
    const result: any = await db.insert(agencies).values({
      name: "其他",
    });
    testAgencyId = Number(result.insertId);

    // 確認「其他」旅行社已創建
    const after = await db.select().from(agencies).where(eq(agencies.name, "其他"));
    expect(after.length).toBe(1);
    expect(after[0].name).toBe("其他");
  });

  it("應該成功導入旅行團到「其他」旅行社", async () => {
    // 確保「其他」旅行社存在
    let otherAgency = await db.select().from(agencies).where(eq(agencies.name, "其他")).limit(1);
    if (otherAgency.length === 0) {
      const result: any = await db.insert(agencies).values({
        name: "其他",
      });
      testAgencyId = Number(result.insertId);
    } else {
      testAgencyId = otherAgency[0].id;
    }

    // 模擬提取的旅行團資訊
    const extractedTour = {
      title: "測試旅行團 - 日本東京",
      destination: "日本",
      price: 8888,
      days: 5,
      nights: 4,
      highlights: "東京迪士尼、淺草寺、富士山",
    };

    // 導入旅行團
    const tourToInsert = {
      agencyId: testAgencyId,
      title: extractedTour.title,
      destination: extractedTour.destination,
      days: extractedTour.days || 0,
      nights: extractedTour.nights || 0,
      tourType: "pure_play" as const,
      price: extractedTour.price.toString(),
      departureDate: new Date(),
      returnDate: new Date(Date.now() + (extractedTour.days || 1) * 24 * 60 * 60 * 1000),
      itinerary: extractedTour.highlights || "待補充",
      affiliateLink: "",
      highlights: extractedTour.highlights || null,
      sourceUrl: null,
      isPublished: false,
    };

    await db.insert(tours).values(tourToInsert);

    // 驗證旅行團已導入
    const insertedTours = await db.select().from(tours).where(eq(tours.title, "測試旅行團 - 日本東京"));
    expect(insertedTours.length).toBe(1);
    expect(insertedTours[0].destination).toBe("日本");
    expect(insertedTours[0].price).toBe("8888.00");
    expect(insertedTours[0].days).toBe(5);
    expect(insertedTours[0].nights).toBe(4);
    expect(insertedTours[0].isPublished).toBe(false);
  });

  it("應該正確處理缺少可選欄位的旅行團", async () => {
    // 確保「其他」旅行社存在
    let otherAgency = await db.select().from(agencies).where(eq(agencies.name, "其他")).limit(1);
    if (otherAgency.length === 0) {
      const result: any = await db.insert(agencies).values({
        name: "其他",
      });
      testAgencyId = Number(result.insertId);
    } else {
      testAgencyId = otherAgency[0].id;
    }

    // 模擬只有必填欄位的旅行團
    const minimalTour = {
      title: "測試旅行團 - 韓國首爾",
      destination: "韓國",
      price: 5555,
    };

    // 導入旅行團
    const tourToInsert = {
      agencyId: testAgencyId,
      title: minimalTour.title,
      destination: minimalTour.destination,
      days: 0,
      nights: 0,
      tourType: "pure_play" as const,
      price: minimalTour.price.toString(),
      departureDate: new Date(),
      returnDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      itinerary: "待補充",
      affiliateLink: "",
      highlights: null,
      sourceUrl: null,
      isPublished: false,
    };

    await db.insert(tours).values(tourToInsert);

    // 驗證旅行團已導入
    const insertedTours = await db.select().from(tours).where(eq(tours.title, "測試旅行團 - 韓國首爾"));
    expect(insertedTours.length).toBe(1);
    expect(insertedTours[0].destination).toBe("韓國");
    expect(insertedTours[0].price).toBe("5555.00");
    expect(insertedTours[0].days).toBe(0);
    expect(insertedTours[0].nights).toBe(0);
    expect(insertedTours[0].itinerary).toBe("待補充");

    // 清理測試數據
    await db.delete(tours).where(eq(tours.title, "測試旅行團 - 韓國首爾"));
  });

  it("應該根據 agencyName 自動創建新旅行社", async () => {
    // 確認「捷旅」旅行社不存在
    const before = await db.select().from(agencies).where(eq(agencies.name, "捷旅"));
    expect(before.length).toBe(0);

    // 模擬提取的旅行團資訊（指定旅行社名稱）
    const extractedTour = {
      title: "測試旅行團 - 捷克布拉格",
      destination: "捷克",
      price: 12888,
      days: 7,
      nights: 6,
      highlights: "布拉格城堡、查理大橋",
    };

    // 使用 agencyName 導入旅行團
    const agencyName = "捷旅";
    let targetAgency = await db.select().from(agencies).where(eq(agencies.name, agencyName)).limit(1);
    
    let agencyId: number;
    if (targetAgency.length === 0) {
      const result: any = await db.insert(agencies).values({
        name: agencyName,
      });
      // result 是數組，使用 result[0].insertId
      const insertId = result[0].insertId;
      agencyId = Number(insertId);
      console.log("Created new agency with insertId:", insertId, "agencyId:", agencyId);
    } else {
      agencyId = targetAgency[0].id;
      console.log("Using existing agency with ID:", agencyId);
    }
    
    // 確認 agencyId 有效
    if (!agencyId || isNaN(agencyId)) {
      throw new Error(`Invalid agencyId: ${agencyId}, result structure issue`);
    }

    // 導入旅行團
    const tourToInsert = {
      agencyId,
      title: extractedTour.title,
      destination: extractedTour.destination,
      days: extractedTour.days || 0,
      nights: extractedTour.nights || 0,
      tourType: "pure_play" as const,
      price: extractedTour.price.toString(),
      departureDate: new Date(),
      returnDate: new Date(Date.now() + (extractedTour.days || 1) * 24 * 60 * 60 * 1000),
      itinerary: extractedTour.highlights || "待補充",
      affiliateLink: "",
      highlights: extractedTour.highlights || null,
      sourceUrl: null,
      isPublished: false,
    };

    await db.insert(tours).values(tourToInsert);

    // 驗證「捷旅」旅行社已創建
    const after = await db.select().from(agencies).where(eq(agencies.name, "捷旅"));
    expect(after.length).toBe(1);
    expect(after[0].name).toBe("捷旅");

    // 驗證旅行團已導入到「捷旅」旅行社
    const insertedTours = await db.select().from(tours).where(eq(tours.title, "測試旅行團 - 捷克布拉格"));
    expect(insertedTours.length).toBe(1);
    expect(insertedTours[0].destination).toBe("捷克");
    expect(insertedTours[0].price).toBe("12888.00");
    expect(insertedTours[0].agencyId).toBe(agencyId);
  });
});
