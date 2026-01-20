import { describe, it, expect } from "vitest";
import { extractTourLinks, searchPDFLinks } from "./pdfDiscovery";

describe("PDF Discovery", () => {
  describe("extractTourLinks", () => {
    it("should extract tour links with /Itinerary/ pattern", async () => {
      const html = `
        <html>
          <body>
            <a href="/website/Itinerary/HTJOKT06">Tour 1</a>
            <a href="/website/Itinerary/HTJOKT05">Tour 2</a>
            <a href="/website/other">Other</a>
          </body>
        </html>
      `;
      const baseUrl = "https://www.egltours.com";
      const links = await extractTourLinks(html, baseUrl);
      
      expect(links).toHaveLength(2);
      expect(links[0]).toBe("https://www.egltours.com/website/Itinerary/HTJOKT06");
      expect(links[1]).toBe("https://www.egltours.com/website/Itinerary/HTJOKT05");
    });

    it("should extract tour links with /tour/ pattern", async () => {
      const html = `
        <html>
          <body>
            <a href="/tour/123">Tour 1</a>
            <a href="/product/456">Product 1</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const links = await extractTourLinks(html, baseUrl);
      
      expect(links).toHaveLength(2);
      expect(links[0]).toBe("https://example.com/tour/123");
      expect(links[1]).toBe("https://example.com/product/456");
    });

    it("should handle relative URLs", async () => {
      const html = `
        <html>
          <body>
            <a href="tour/123">Relative Tour</a>
            <a href="/tour/456">Absolute Tour</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com/website/";
      const links = await extractTourLinks(html, baseUrl);
      
      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link).toMatch(/^https:\/\//);
      });
    });

    it("should deduplicate links", async () => {
      const html = `
        <html>
          <body>
            <a href="/tour/123">Tour 1</a>
            <a href="/tour/123">Tour 1 Again</a>
            <a href="/tour/456">Tour 2</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const links = await extractTourLinks(html, baseUrl);
      
      expect(links).toHaveLength(2);
    });
  });

  describe("searchPDFLinks", () => {
    it("should find direct PDF links", async () => {
      const html = `
        <html>
          <body>
            <a href="/files/tour1.pdf">Download PDF</a>
            <a href="/files/tour2.pdf?version=1">Download PDF 2</a>
            <a href="/files/image.jpg">Not a PDF</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks).toHaveLength(2);
      expect(pdfLinks[0].url).toBe("https://example.com/files/tour1.pdf");
      expect(pdfLinks[1].url).toBe("https://example.com/files/tour2.pdf?version=1");
    });

    it("should find PDF links with Chinese text", async () => {
      const html = `
        <html>
          <body>
            <a href="/download.pdf">下載行程表</a>
            <a href="/detail.pdf">詳細行程</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks).toHaveLength(2);
    });

    it("should extract PDF from onclick events", async () => {
      const html = `
        <html>
          <body>
            <button onclick="window.open('/files/tour.pdf')">View PDF</button>
            <a onclick="downloadPDF('/files/brochure.pdf')">Download</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks.length).toBeGreaterThan(0);
      expect(pdfLinks.some(link => link.url.includes("tour.pdf"))).toBe(true);
    });

    it("should extract PDF from data attributes", async () => {
      const html = `
        <html>
          <body>
            <div data-pdf="/files/tour.pdf">Tour Info</div>
            <div data-file="/files/brochure.pdf">Brochure</div>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks).toHaveLength(2);
    });

    it("should deduplicate PDF links", async () => {
      const html = `
        <html>
          <body>
            <a href="/tour.pdf">PDF 1</a>
            <a href="/tour.pdf">PDF 1 Again</a>
            <a href="/brochure.pdf">PDF 2</a>
          </body>
        </html>
      `;
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks).toHaveLength(2);
    });

    it("should handle empty HTML", async () => {
      const html = "<html><body></body></html>";
      const baseUrl = "https://example.com";
      const pdfLinks = await searchPDFLinks(html, baseUrl);
      
      expect(pdfLinks).toHaveLength(0);
    });
  });
});
