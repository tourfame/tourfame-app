/**
 * Deep Link Scraper Module
 * Follow links to detail pages and extract comprehensive tour information
 */

import * as cheerio from "cheerio";
import { smartScrape } from "./scraper";

export interface TourDetailLink {
  url: string;
  title?: string;
}

export interface ScrapedTourDetail {
  url: string;
  html: string;
  title?: string;
}

/**
 * Extract tour detail page links from a listing page
 * Enhanced version with multiple strategies
 */
export async function extractDetailLinks(
  html: string,
  baseUrl: string,
  maxLinks: number = 10
): Promise<TourDetailLink[]> {
  const $ = cheerio.load(html);
  const links: TourDetailLink[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Links with tour codes (e.g., /Itinerary/HTJOKT06)
  $('a[href*="/Itinerary/"], a[href*="/itinerary/"]').each((_: number, el: any) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim() || $(el).attr("title");
    if (href && links.length < maxLinks) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          links.push({ url: fullUrl, title });
        }
      } catch (error) {
        console.error(`Invalid URL: ${href}`);
      }
    }
  });

  // Strategy 2: Common tour patterns
  $(
    'a[href*="/tour/"], a[href*="/product/"], a[href*="/detail/"], a[href*="/package/"]'
  ).each((_: number, el: any) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim() || $(el).attr("title");
    if (href && links.length < maxLinks) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          links.push({ url: fullUrl, title });
        }
      } catch (error) {
        console.error(`Invalid URL: ${href}`);
      }
    }
  });

  // Strategy 3: Links in tour cards/items
  $(
    '.tour-item a, .tour-card a, .product-item a, .package-item a, [class*="tour"] a'
  ).each((_: number, el: any) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim() || $(el).attr("title");
    if (href && links.length < maxLinks) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        // Filter out non-detail links (e.g., category pages, home page)
        if (
          !fullUrl.includes("/category") &&
          !fullUrl.includes("/list") &&
          !fullUrl.endsWith("/") &&
          !seenUrls.has(fullUrl)
        ) {
          seenUrls.add(fullUrl);
          links.push({ url: fullUrl, title });
        }
      } catch (error) {
        console.error(`Invalid URL: ${href}`);
      }
    }
  });

  return links.slice(0, maxLinks);
}

/**
 * Scrape multiple detail pages
 * @param detailLinks - Array of detail page links
 * @param delayMs - Delay between requests in milliseconds
 * @returns Array of scraped detail pages
 */
export async function scrapeDetailPages(
  detailLinks: TourDetailLink[],
  delayMs: number = 1000
): Promise<ScrapedTourDetail[]> {
  const results: ScrapedTourDetail[] = [];

  for (const link of detailLinks) {
    try {
      const { html } = await smartScrape(link.url);

      results.push({
        url: link.url,
        html,
        title: link.title,
      });


      // Add delay between requests
      if (results.length < detailLinks.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[Deep Link Scraper] Error scraping ${link.url}:`, error);
      // Continue with next link even if one fails
    }
  }

  return results;
}

/**
 * Scrape listing page and all linked detail pages
 * @param listingUrl - URL of the listing page
 * @param maxDetailPages - Maximum number of detail pages to scrape
 * @returns Combined HTML content from all pages
 */
export async function scrapeListingWithDetails(
  listingUrl: string,
  maxDetailPages: number = 5
): Promise<{
  listingHtml: string;
  detailPages: ScrapedTourDetail[];
  combinedContent: string;
}> {

  // Scrape listing page
  const { html: listingHtml } = await smartScrape(listingUrl);

  // Extract detail links
  const detailLinks = await extractDetailLinks(listingHtml, listingUrl, maxDetailPages);

  // Scrape detail pages
  const detailPages = await scrapeDetailPages(detailLinks);

  // Combine all content
  let combinedContent = `=== LISTING PAGE ===\n${listingHtml}\n\n`;
  detailPages.forEach((page, index) => {
    combinedContent += `=== DETAIL PAGE ${index + 1}: ${page.url} ===\n${page.html}\n\n`;
  });


  return {
    listingHtml,
    detailPages,
    combinedContent,
  };
}
