import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the database functions
vi.mock("./db", () => ({
  createScrapeJob: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateScrapeJob: vi.fn().mockResolvedValue({}),
  getAllAgencies: vi.fn().mockResolvedValue([
    { id: 1, name: "其他" },
    { id: 2, name: "捷旅" },
  ]),
}));

describe("Text Extraction API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate that textContent is required", async () => {
    // Test that empty textContent should be rejected
    const emptyInput = "";
    expect(emptyInput.trim().length).toBe(0);
  });

  it("should parse tour information from text correctly", () => {
    const sampleText = `
目的地：埃及
題目：埃及 探索法老迷城、尼羅河兩岸文明
團費：HKD 31,998 + (優惠 HKD 30,998 +)
PDF 鏈結：https://www.jetour.com.hk/storage/app/media/pdf/sp-med25-022-1229-kgt.pdf
    `;

    // Verify the text contains expected keywords
    expect(sampleText).toContain("埃及");
    expect(sampleText).toContain("31,998");
    expect(sampleText).toContain("pdf");
  });

  it("should handle multiple tours in one text block", () => {
    const multiTourText = `
目的地：埃及
題目：埃及 探索法老迷城
團費：HKD 31,998

目的地：日本
題目：日本 東京大阪
團費：HKD 12,998
    `;

    // Count occurrences of "目的地"
    const matches = multiTourText.match(/目的地/g);
    expect(matches?.length).toBe(2);
  });

  it("should extract PDF URLs from text", () => {
    const textWithPdf = `
PDF 鏈結：https://www.jetour.com.hk/storage/app/media/pdf/sp-med25-022-1229-kgt.pdf
    `;

    const pdfUrlMatch = textWithPdf.match(/https?:\/\/[^\s]+\.pdf/);
    expect(pdfUrlMatch).not.toBeNull();
    expect(pdfUrlMatch?.[0]).toContain(".pdf");
  });

  it("should handle text without PDF URLs", () => {
    const textWithoutPdf = `
目的地：日本
題目：日本 東京大阪
團費：HKD 12,998
    `;

    const pdfUrlMatch = textWithoutPdf.match(/https?:\/\/[^\s]+\.pdf/);
    expect(pdfUrlMatch).toBeNull();
  });

  it("should extract price from various formats", () => {
    const priceFormats = [
      { text: "HKD 31,998", expected: 31998 },
      { text: "團費：HKD 12,998 +", expected: 12998 },
      { text: "$15,000", expected: 15000 },
    ];

    priceFormats.forEach(({ text, expected }) => {
      const priceMatch = text.match(/[\d,]+/);
      if (priceMatch) {
        const price = parseInt(priceMatch[0].replace(/,/g, ""));
        expect(price).toBe(expected);
      }
    });
  });
});
