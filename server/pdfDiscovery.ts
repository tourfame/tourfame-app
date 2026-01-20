/**
 * PDF Discovery Module
 * Automatically discover PDF links from tour listing pages and detail pages
 */

import * as cheerio from "cheerio";

export interface PDFLink {
  url: string;
  text?: string;
  source: "listing" | "detail";
  tourId?: string;
}

/**
 * Extract tour detail page links from a listing page
 */
export async function extractTourLinks(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Find links with tour codes (e.g., HTJOKT06)
  $('a[href*="/Itinerary/"]').each((_: number, el: any) => {
    const href = $(el).attr("href");
    if (href) {
      const fullUrl = new URL(href, baseUrl).href;
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        links.push(fullUrl);
      }
    }
  });

  // Strategy 2: Find links with common tour patterns
  $('a[href*="/tour/"], a[href*="/product/"], a[href*="/detail/"]').each((_: number, el: any) => {
    const href = $(el).attr("href");
    if (href) {
      const fullUrl = new URL(href, baseUrl).href;
      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        links.push(fullUrl);
      }
    }
  });

  return links;
}

/**
 * Search for PDF links in a page (listing or detail)
 */
export async function searchPDFLinks(html: string, baseUrl: string): Promise<PDFLink[]> {
  const $ = cheerio.load(html);
  const pdfLinks: PDFLink[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Direct PDF links (<a href="*.pdf">)
  $('a[href$=".pdf"], a[href*=".pdf?"]').each((_: number, el: any) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          pdfLinks.push({
            url: fullUrl,
            text: text || undefined,
            source: "detail",
          });
        }
      } catch (error) {
        console.error(`Invalid PDF URL: ${href}`);
      }
    }
  });

  // Strategy 2: Links with PDF-related text
  $('a:contains("PDF"), a:contains("下載"), a:contains("行程表"), a:contains("詳細行程")').each((_: number, el: any) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href && href.toLowerCase().includes("pdf")) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          pdfLinks.push({
            url: fullUrl,
            text: text || undefined,
            source: "detail",
          });
        }
      } catch (error) {
        console.error(`Invalid PDF URL: ${href}`);
      }
    }
  });

  // Strategy 3: onclick events with PDF
  $('[onclick*=".pdf"], [onclick*="PDF"]').each((_: number, el: any) => {
    const onclick = $(el).attr("onclick");
    if (onclick) {
      // Extract URL from onclick (e.g., window.open('url.pdf'))
      const match = onclick.match(/['"]([^'"]*\.pdf[^'"]*)['"]/i);
      if (match && match[1]) {
        try {
          const fullUrl = new URL(match[1], baseUrl).href;
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl);
            pdfLinks.push({
              url: fullUrl,
              text: $(el).text().trim() || undefined,
              source: "detail",
            });
          }
        } catch (error) {
          console.error(`Invalid PDF URL from onclick: ${match[1]}`);
        }
      }
    }
  });

  // Strategy 4: data-* attributes with PDF
  $('[data-pdf], [data-file], [data-url]').each((_: number, el: any) => {
    const dataPdf = $(el).attr("data-pdf") || $(el).attr("data-file") || $(el).attr("data-url");
    if (dataPdf && dataPdf.toLowerCase().includes(".pdf")) {
      try {
        const fullUrl = new URL(dataPdf, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          pdfLinks.push({
            url: fullUrl,
            text: $(el).text().trim() || undefined,
            source: "detail",
          });
        }
      } catch (error) {
        console.error(`Invalid PDF URL from data attribute: ${dataPdf}`);
      }
    }
  });

  return pdfLinks;
}

/**
 * Discover all PDFs from a tour listing page
 * 1. Extract tour detail links
 * 2. Visit each detail page
 * 3. Search for PDF links
 */
export async function discoverPDFsFromListing(
  listingUrl: string,
  maxDetailPages: number = 10
): Promise<PDFLink[]> {
  const allPdfLinks: PDFLink[] = [];

  try {
    // Fetch listing page
    const listingResponse = await fetch(listingUrl);
    if (!listingResponse.ok) {
      throw new Error(`Failed to fetch listing page: ${listingResponse.statusText}`);
    }
    const listingHtml = await listingResponse.text();

    // Search for PDFs directly in listing page
    const listingPdfs = await searchPDFLinks(listingHtml, listingUrl);
    listingPdfs.forEach((pdf) => {
      pdf.source = "listing";
      allPdfLinks.push(pdf);
    });

    // Extract tour detail links
    const tourLinks = await extractTourLinks(listingHtml, listingUrl);

    // Visit each detail page (limit to maxDetailPages)
    if (!tourLinks || tourLinks.length === 0) {
      return allPdfLinks;
    }
    const linksToVisit = tourLinks.slice(0, maxDetailPages);
    for (const tourLink of linksToVisit) {
      try {
        const detailResponse = await fetch(tourLink);
        if (!detailResponse.ok) {
          console.error(`Failed to fetch detail page: ${detailResponse.statusText}`);
          continue;
        }
        const detailHtml = await detailResponse.text();

        // Search for PDFs in detail page
        const detailPdfs = await searchPDFLinks(detailHtml, tourLink);
        if (detailPdfs && detailPdfs.length > 0) {
          detailPdfs.forEach((pdf) => {
            if (tourLink) {
              pdf.tourId = tourLink.split("/").pop();
            }
            allPdfLinks.push(pdf);
          });
        }

        // Add delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Error fetching detail page ${tourLink}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error(`Error discovering PDFs: ${error.message}`);
    throw error;
  }

  return allPdfLinks;
}
