import { describe, it, expect } from "vitest";
import { isPDFUrl, findPDFLinks } from "./pdfParser";

describe("PDF Parser", () => {
  describe("isPDFUrl", () => {
    it("should detect .pdf extension", () => {
      expect(isPDFUrl("https://example.com/document.pdf")).toBe(true);
      expect(isPDFUrl("https://example.com/tours.PDF")).toBe(true);
    });

    it("should detect .pdf with query parameters", () => {
      expect(isPDFUrl("https://example.com/document.pdf?download=1")).toBe(true);
    });

    it("should return false for non-PDF URLs", () => {
      expect(isPDFUrl("https://example.com/page.html")).toBe(false);
      expect(isPDFUrl("https://example.com/tours")).toBe(false);
      expect(isPDFUrl("https://example.com/document.doc")).toBe(false);
    });
  });

  describe("findPDFLinks", () => {
    it("should find PDF links in HTML", () => {
      const html = `
        <html>
          <body>
            <a href="/tours/japan.pdf">Japan Tours</a>
            <a href="https://example.com/korea.pdf">Korea Tours</a>
            <a href="/page.html">Regular Page</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const links = findPDFLinks(html, baseUrl);

      expect(links).toContain("https://example.com/tours/japan.pdf");
      expect(links).toContain("https://example.com/korea.pdf");
      expect(links).toHaveLength(2);
    });

    it("should handle relative URLs", () => {
      const html = '<a href="./documents/tour.pdf">Tour PDF</a>';
      const baseUrl = "https://example.com/tours/";
      const links = findPDFLinks(html, baseUrl);

      expect(links).toContain("https://example.com/tours/documents/tour.pdf");
    });

    it("should deduplicate PDF links", () => {
      const html = `
        <a href="/tour.pdf">Link 1</a>
        <a href="/tour.pdf">Link 2</a>
        <a href="https://example.com/tour.pdf">Link 3</a>
      `;
      const baseUrl = "https://example.com";
      const links = findPDFLinks(html, baseUrl);

      expect(links).toHaveLength(1);
      expect(links[0]).toBe("https://example.com/tour.pdf");
    });

    it("should return empty array when no PDF links found", () => {
      const html = '<a href="/page.html">Regular Page</a>';
      const baseUrl = "https://example.com";
      const links = findPDFLinks(html, baseUrl);

      expect(links).toEqual([]);
    });
  });
});
