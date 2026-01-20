import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createScrapeJob,
  getScrapeJobById,
  getAllScrapeJobs,
  updateScrapeJob,
  bulkInsertTours,
  getAllImageCategories,
  updateImageCategoryKeywords,
  updateImageCategoryImage,
  createImageCategory,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapeJobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Determine if an error is retryable
 * @param errorMessage - Error message from failed job
 * @returns true if the error is retryable
 */
function isRetryableError(errorMessage: string): boolean {
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /rate limit/i,
    /too many requests/i,
    /503/i,
    /502/i,
    /504/i,
    /temporary/i,
  ];
  
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Create a new scrape job
  createScrapeJob: adminProcedure
    .input(
      z.object({
        name: z.string().optional(),
        url: z.string().url(),
        price: z.number().optional(),
        agencyId: z.number().optional(),
        category: z.enum(["japan", "asia", "long_haul", "china_long_haul", "guangdong"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get default agency ID ("其他") if not provided
      let agencyId = input.agencyId;
      if (!agencyId) {
        const { getAllAgencies } = await import("../db");
        const agencies = await getAllAgencies();
        const defaultAgency = agencies.find((a: any) => a.name === "其他");
        if (defaultAgency) {
          agencyId = defaultAgency.id;
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "找不到預設旅行社",
          });
        }
      }

      const result = await createScrapeJob({
        name: input.name || "爬蟲任務",
        url: input.url,
        price: input.price,
        agencyId: agencyId!,
        category: input.category,
        createdBy: ctx.user.id,
      });

      return { success: true, jobId: (result as any).insertId || 0 };
    }),

  // 從文字提取旅行團資訊
  batchCreateScrapeJobs: adminProcedure
    .input(
      z.object({
        textContent: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 提取文字第一行作為旅行社名稱（用於顯示）
      const firstLine = input.textContent.split('\n')[0].trim();
      
      // 查找或創建臨時旅行社用於記錄任務
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法連接數據庫",
        });
      }
      const { agencies } = await import("../../drizzle/schema");
      let tempAgency = await db.select().from(agencies).limit(1);
      
      let tempAgencyId: number;
      if (tempAgency.length === 0) {
        // 如果沒有任何旅行社，創建一個臨時的
        const result: any = await db.insert(agencies).values({
          name: firstLine || "其他",
        });
        tempAgencyId = Number(result[0].insertId);
      } else {
        tempAgencyId = tempAgency[0].id;
      }

      // 創建一個任務來記錄這次提取
      const result = await createScrapeJob({
        name: `文字提取 - ${input.textContent.substring(0, 30)}...`,
        url: "text://input",
        agencyId: tempAgencyId,
        createdBy: ctx.user.id,
      });
      
      const jobId = (result as any).insertId || 0;

      // 使用 LLM 從文字中提取旅行團資訊
      try {
        await updateScrapeJob(jobId, { status: "processing" });
        
        // 添加超時處理（60 秒）
        const llmPromise = invokeLLM({
          max_tokens: 4000,
          messages: [
            {
              role: "system",
              content: `你是一個旅行團資訊提取助手。從用戶提供的文字中提取旅行團資訊並返回結構化 JSON 數據。

重要規則：
1. 文字的第一行是旅行社名稱，請提取並返回在 agencyName 欄位
2. 最多提取 50 個旅行團資訊

對於每個找到的旅行團，提取以下資訊：

必填欄位：
- title: 旅行團標題/名稱
- destination: 目的地國家/城市
- price: 價格（只要數字，例如 31998）

可選欄位（如果文字中有提到則填寫，沒有則留空字符串 ""）：
- days: 天數（整數）
- nights: 晚數（整數）
- highlights: 行程亮點
- whatsapp: WhatsApp 聯繫號碼
- phone: 電話聯繫號碼
- pdfUrl: PDF 鏈結

返回格式：
{
  "agencyName": "旅行社名稱（從第一行提取）",
  "tours": [...]
}

如果沒有找到旅行團，返回 { "agencyName": "第一行文字", "tours": [] }。`,
            },
            {
              role: "user",
              content: `從以下文字中提取旅行團資訊：\n\n${input.textContent}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tour_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  agencyName: { type: "string", description: "旅行社名稱（從文字第一行提取）" },
                  tours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        destination: { type: "string" },
                        days: { type: "integer" },
                        nights: { type: "integer" },
                        price: { type: "number" },
                        highlights: { type: "string" },
                        whatsapp: { type: "string" },
                        phone: { type: "string" },
                        pdfUrl: { type: "string" },
                      },
                      required: ["title", "destination", "price"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["agencyName", "tours"],
                additionalProperties: false,
              },
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('LLM 調用超時（60秒），請縮短文字內容或分批輸入')), 60000);
        });

        const llmResponse = await Promise.race([llmPromise, timeoutPromise]) as any;

        const messageContent = llmResponse.choices[0]?.message?.content;
        const responseContent = typeof messageContent === 'string' ? messageContent : "{\"agencyName\":\"\",\"tours\":[]}";
        const parsedResult = JSON.parse(responseContent);
        const agencyName = parsedResult.agencyName || "其他";
        const tours = parsedResult.tours || [];

        // 更新任務狀態和結果
        await updateScrapeJob(jobId, {
          status: "completed",
          rawData: JSON.stringify({ agencyName, tours }),
          toursFound: tours.length,
        });

        return { success: true, jobIds: [jobId], count: 1, toursExtracted: tours.length, agencyName, tours };
      } catch (error: any) {
        await updateScrapeJob(jobId, {
          status: "failed",
          errorMessage: error.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `提取失敗: ${error.message}`,
        });
      }
    }),

  // Get all scrape jobs
  getScrapeJobs: adminProcedure.query(async () => {
    return await getAllScrapeJobs(50);
  }),

  // Get scrape job by ID
  getScrapeJobById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const job = await getScrapeJobById(input.id);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scrape job not found",
        });
      }
      return job;
    }),

  // Execute scraping (using LLM to parse webpage)
  executeScrape: adminProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      const job = await getScrapeJobById(input.jobId);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scrape job not found",
        });
      }

      try {
        // Update status to processing
        await updateScrapeJob(input.jobId, {
          status: "processing",
        });

        let content: string;
        let sourceType: string;
        let sourceUrl: string | null = null;

        // 檢查是否是文字輸入任務（已經在 batchCreateScrapeJobs 中處理完成）
        if (job.url === "text://input") {
          // 文字輸入任務已經在創建時處理完成，直接返回結果
          const rawData = job.rawData ? JSON.parse(job.rawData) : [];
          return {
            success: true,
            jobId: input.jobId,
            tours: rawData,
            toursFound: rawData.length,
            sourceType: "text_input",
          };
        }

        // Check if URL is a PDF file or a listing page
        const { isPDFUrl, extractTextFromPDF } = await import("../pdfParser");
        const { discoverPDFsFromListing } = await import("../pdfDiscovery");
        
        if (isPDFUrl(job.url)) {
          // Extract text from PDF (no upload at this stage)
          sourceUrl = job.url; // Save original PDF URL for on-demand upload
          content = await extractTextFromPDF(job.url);
          sourceType = "PDF";
        } else if (job.url.includes("/tour-line/") || job.url.includes("/tours") || job.url.includes("/list")) {
          // Detected listing page - try deep link scraping first
          
          try {
            // Try deep link scraping to get comprehensive content
            const { scrapeListingWithDetails } = await import("../deepLinkScraper");
            const deepScrapeResult = await scrapeListingWithDetails(job.url, 5);
            
            if (deepScrapeResult.detailPages.length > 0) {
              content = deepScrapeResult.combinedContent;
              sourceType = "deep_scrape";
            } else {
              // No detail pages found, try PDF discovery
              const discoveredPdfs = await discoverPDFsFromListing(job.url, 5);
              
              if (discoveredPdfs && discoveredPdfs.length > 0) {
                const firstPdf = discoveredPdfs[0];
                if (firstPdf && firstPdf.url) {
                  sourceUrl = firstPdf.url;
                  content = await extractTextFromPDF(firstPdf.url);
                  sourceType = "PDF (discovered)";
                } else {
                  // Fallback to normal scraping
                  const { smartScrape } = await import("../scraper");
                  const { html, method } = await smartScrape(job.url);
                  content = html;
                  sourceType = method;
                }
              } else {
                // Fallback to normal scraping
                const { smartScrape } = await import("../scraper");
                const { html, method } = await smartScrape(job.url);
                content = html;
                sourceType = method;
              }
            }
          } catch (deepScrapeError: any) {
            console.error(`Deep scrape failed: ${deepScrapeError.message}, falling back to PDF discovery`);
            // Fallback to PDF discovery
            const discoveredPdfs = await discoverPDFsFromListing(job.url, 5);
            
            if (discoveredPdfs && discoveredPdfs.length > 0) {
              const firstPdf = discoveredPdfs[0];
              if (firstPdf && firstPdf.url) {
                sourceUrl = firstPdf.url;
                content = await extractTextFromPDF(firstPdf.url);
                sourceType = "PDF (discovered)";
              } else {
                const { smartScrape } = await import("../scraper");
                const { html, method } = await smartScrape(job.url);
                content = html;
                sourceType = method;
              }
            } else {
              const { smartScrape } = await import("../scraper");
              const { html, method } = await smartScrape(job.url);
              content = html;
              sourceType = method;
            }
          }
        } else {
          // Fetch the webpage using smart scraping (Puppeteer fallback)
          const { smartScrape } = await import("../scraper");
          const { html, method } = await smartScrape(job.url);
          content = html;
          sourceType = method;
        }

        // Use LLM to extract tour information
        
        const llmResponse = await invokeLLM({
          max_tokens: 4000, // 增加 token 限制以支持更長的回應
          messages: [
            {
              role: "system",
              content: `You are a tour information extraction assistant. Extract tour package information from various content formats (HTML, PDF text, OCR text) and return structured JSON data.

IMPORTANT:
- The content may be from OCR (image-to-text), so text formatting might be imperfect
- Look for tour information even if the text structure is messy
- Be flexible with date formats and number formats
- Extract contact information (WhatsApp, phone) from anywhere in the content
              
For each tour found, extract:

**基本信息（必填）：**
- title: Tour title/name (required)
- destination: Destination country/city (required)
- days: Number of days (integer, required)
- nights: Number of nights (integer, required)
- price: Price in HKD (decimal number only, no currency symbol, required)

**行程信息（盡量提取，找不到则用空字符串）：**
- highlights: Tour highlights, key attractions, special activities (string)
- itinerary: Detailed day-by-day itinerary (string)
- inclusions: What's included in the price (flights, hotels, meals, tickets, etc.) (string)
- exclusions: What's NOT included (visa fees, tips, optional activities, etc.) (string)

**住宿與餐食（盡量提取，找不到则用空字符串）：**
- hotels: Hotel arrangements (hotel names, star ratings, locations) (string)
- meals: Meal arrangements (breakfast, lunch, dinner details) (string)

**其他信息（可選）：**
- departureDate: Departure date (ISO format YYYY-MM-DD, use empty string if not found)
- imageUrl: Image URL (string, use empty string if not found)
- whatsapp: WhatsApp contact number (string, use empty string if not found)
- phone: Phone contact number (string, use empty string if not found)

Return a JSON array of tour objects. If no tours found, return empty array.`,
            },
            {
              role: "user",
              content: `Extract tour information from this content (${sourceType}):\n\n${content.slice(0, 50000)}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tour_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        destination: { type: "string" },
                        days: { type: "integer" },
                        nights: { type: "integer" },
                        price: { type: "number" },
                        departureDate: { type: "string" },
                        highlights: { type: "string" },
                        itinerary: { type: "string" },
                        inclusions: { type: "string", description: "What's included in the price or empty string" },
                        exclusions: { type: "string", description: "What's NOT included or empty string" },
                        hotels: { type: "string", description: "Hotel arrangements or empty string" },
                        meals: { type: "string", description: "Meal arrangements or empty string" },
                        imageUrl: { type: "string", description: "Image URL or empty string if not available" },
                        whatsapp: { type: "string", description: "WhatsApp contact number or empty string if not available" },
                        phone: { type: "string", description: "Phone contact number or empty string if not available" },
                      },
                      required: [
                        "title",
                        "destination",
                        "days",
                        "nights",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tours"],
                additionalProperties: false,
              },
            },
          },
        });

        // Safely access LLM response with detailed error messages
        
        if (!llmResponse || !llmResponse.choices) {
          console.error(`[Scraper] Invalid LLM response:`, llmResponse);
          throw new Error("LLM response is undefined or has no choices");
        }
        if (!llmResponse.choices[0]) {
          throw new Error("LLM response choices array is empty");
        }
        
        // Extract content from LLM response, handling potential thinking/reasoning content
        let llmContent = llmResponse.choices[0]?.message?.content;
        
        // If content is an array (multimodal response), extract text parts only
        if (Array.isArray(llmContent)) {
          llmContent = llmContent
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('');
        }
        
        if (!llmContent || typeof llmContent !== 'string') {
          throw new Error("No content in LLM response message");
        }
        
        // Filter out thinking/reasoning content if present
        // Look for JSON object starting with { and ending with }
        let jsonContent = llmContent;
        
        // Try to find JSON object in the content
        const jsonStartIndex = llmContent.indexOf('{');
        const jsonEndIndex = llmContent.lastIndexOf('}');
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          jsonContent = llmContent.slice(jsonStartIndex, jsonEndIndex + 1);
        }
        
        // Log only the first 500 chars for debugging

        // Use advanced JSON parsing with fallback strategies
        const { parseJSONWithFallback, validateTourData } = await import('../lib/jsonFixer');
        
        let parsedData;
        try {
          // Try standard JSON parse first
          parsedData = JSON.parse(jsonContent);
        } catch (parseError: any) {
          console.error(`[Scraper] Initial JSON parse failed: ${parseError.message}`);
          console.error(`[Scraper] Error position: ${parseError.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
          console.error(`[Scraper] Problematic JSON (first 1000 chars): ${jsonContent.slice(0, 1000)}`);
          console.error(`[Scraper] Problematic JSON (last 1000 chars): ${jsonContent.slice(-1000)}`);
          
          // Try advanced parsing with multiple fallback strategies
          parsedData = parseJSONWithFallback(jsonContent);
          
          if (!parsedData) {
            // Last resort: try to extract tours array specifically
            const toursMatch = jsonContent.match(/"tours"\s*:\s*\[([\s\S]*)\]/);
            if (toursMatch) {
              try {
                const toursArrayContent = '[' + toursMatch[1] + ']';
                const toursArray = parseJSONWithFallback(toursArrayContent);
                if (toursArray && Array.isArray(toursArray)) {
                  parsedData = { tours: toursArray };
                }
              } catch (extractError) {
                console.error(`[Scraper] Failed to extract tours array:`, extractError);
              }
            }
            
            if (!parsedData) {
              throw new Error(`Failed to parse LLM response as JSON after all repair attempts: ${parseError.message}`);
            }
          }
          
        }
        const tours = parsedData?.tours || [];
        if (tours.length === 0) {
          console.warn(`[Scraper] No tours extracted. LLM response:`, llmContent.slice(0, 500));
        }

        // Download and upload PDF if source is a PDF URL
        let pdfUrl: string | undefined = undefined;
        if (sourceUrl && sourceType.includes("PDF")) {
          const { downloadAndUploadPDF } = await import("../pdfDownloader");
          const pdfResult = await downloadAndUploadPDF(sourceUrl, input.jobId);
          if (pdfResult.success && pdfResult.s3Url) {
            pdfUrl = pdfResult.s3Url;
          } else {
            console.error(`[Scraper] Failed to upload PDF: ${pdfResult.error}`);
          }
        }

        // Update job with results
        await updateScrapeJob(input.jobId, {
          status: "completed",
          toursFound: tours.length,
          rawData: JSON.stringify(tours),
          sourceUrl: sourceUrl, // Save original PDF URL
          pdfUrl: pdfUrl, // Save S3 PDF URL if uploaded
          completedAt: new Date(),
        });

        return {
          success: true,
          toursFound: tours.length,
          tours,
          htmlContent: content, // 返回 HTML/文本內容用於提取聯絡方式
          usedOcr: sourceType.includes("OCR") || sourceType.includes("image"),
          extractedLength: content.length,
          sourceType,
        };
      } catch (error: any) {
        console.error(`[Scraper] Job ${input.jobId} failed:`, error.message);
        
        // Get current job to check retry count
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [currentJob] = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, input.jobId)).limit(1);
        
        const retryCount = (currentJob?.retryCount || 0) + 1;
        const maxRetries = currentJob?.maxRetries || 3;
        
        // Determine if we should retry
        const shouldRetry = retryCount <= maxRetries && isRetryableError(error.message);
        
        if (shouldRetry) {
          
          // Update job to pending status for retry
          await updateScrapeJob(input.jobId, {
            status: "pending",
            errorMessage: `重試 ${retryCount}/${maxRetries}: ${error.message}`,
          } as any);
          
          // Schedule retry after a delay (exponential backoff)
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // Max 30 seconds
          
          // Note: Actual retry will be triggered by the scheduler or manual retry
          // We just mark it as pending here
        } else {
          
          // Update job with final error
          await updateScrapeJob(input.jobId, {
            status: "failed",
            errorMessage: `最終失敗（${retryCount - 1} 次重試）: ${error.message}`,
            completedAt: new Date(),
          } as any);
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Batch retry all failed jobs
  batchRetryFailedJobs: adminProcedure
    .mutation(async () => {
      try {
        // Find all failed jobs
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const failedJobs = await db.select().from(scrapeJobs).where(eq(scrapeJobs.status, "failed"));
        
        
        // Reset failed jobs to pending for retry
        let retriedCount = 0;
        for (const job of failedJobs) {
          const retryCount = job.retryCount || 0;
          const maxRetries = job.maxRetries || 3;
          
          // Only retry if under max retries
          if (retryCount < maxRetries) {
            await updateScrapeJob(job.id, {
              status: "pending",
              errorMessage: `批次重試 ${retryCount + 1}/${maxRetries}`,
            } as any);
            retriedCount++;
          }
        }
        
        
        return {
          success: true,
          totalFailed: failedJobs.length,
          retriedCount,
          skippedCount: failedJobs.length - retriedCount,
        };
      } catch (error: any) {
        console.error(`[Batch Retry] Error:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `批次重試失敗：${error.message}`,
        });
      }
    }),

  // Import scraped tours to database
  importTours: adminProcedure
    .input(
      z.object({
        jobId: z.number(),
        tours: z.array(
          z.object({
            title: z.string(),
            destination: z.string(),
            days: z.number(),
            nights: z.number(),
            price: z.number(),
            departureDate: z.string().optional(),
            highlights: z.string().optional(),
            itinerary: z.string().optional(),
            inclusions: z.string().optional(),
            exclusions: z.string().optional(),
            hotels: z.string().optional(),
            meals: z.string().optional(),
            agencyId: z.number(),
            tourType: z.enum(["pure_play", "luxury", "cruise", "budget", "family"]),
            imageUrl: z.string().optional(),
            whatsapp: z.string().optional(),
            phone: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get the scrape job to retrieve the source URL and default price
        const job = await getScrapeJobById(input.jobId);
        const sourceUrl = job?.url || null;
        const defaultPrice = job?.price ? parseFloat(job.price) : 0;

        // Prepare tour data for insertion
        const toursData = input.tours.map((tour) => ({
          agencyId: tour.agencyId,
          scrapeJobId: input.jobId,
          title: tour.title,
          destination: tour.destination,
          days: tour.days,
          nights: tour.nights,
          tourType: tour.tourType,
          // Use tour.price if valid, otherwise use scrape job's price as default
          price: (tour.price && tour.price > 0 ? tour.price : defaultPrice).toString(),
          currency: "HKD",
          departureDate: tour.departureDate
            ? new Date(tour.departureDate)
            : new Date(),
          returnDate: tour.departureDate
            ? new Date(
                new Date(tour.departureDate).getTime() +
                  tour.days * 24 * 60 * 60 * 1000
              )
            : new Date(),
          availableSeats: 20,
          minGroupSize: 10,
          itinerary: tour.itinerary || "詳細行程請查看旅行社網站",
          highlights: tour.highlights || "",
          inclusions: tour.inclusions || "",
          exclusions: tour.exclusions || "",
          hotels: tour.hotels || "",
          meals: tour.meals || "",
          affiliateLink: `https://example.com/tour/${Date.now()}`,
          imageUrl: tour.imageUrl || null,
          sourceUrl: sourceUrl, // Add sourceUrl from scrape job
          status: "active",
          isPublished: true, // Set isPublished to true so tours appear in frontend
        }));

        await bulkInsertTours(toursData);

        // Update agency contact info if provided (from first tour)
        if (input.tours.length > 0) {
          const firstTour = input.tours[0];
          if (firstTour.whatsapp || firstTour.phone) {
            const { updateAgency } = await import("../db");
            await updateAgency(firstTour.agencyId, {
              whatsapp: firstTour.whatsapp,
              phone: firstTour.phone,
            });
          }
        }

        // Delete PDF from S3 if exists
        if (job?.pdfUrl) {
          try {
            const { storageDelete } = await import("../storage");
            // Extract the key from the S3 URL
            const urlObj = new URL(job.pdfUrl);
            const pathParts = urlObj.pathname.split('/');
            // Find the index of 'scrape-jobs' in the path
            const scrapeJobsIndex = pathParts.findIndex(part => part === 'scrape-jobs');
            if (scrapeJobsIndex !== -1) {
              // Reconstruct the key from 'scrape-jobs' onwards
              const key = pathParts.slice(scrapeJobsIndex).join('/');
              await storageDelete(key);
            }
          } catch (deleteError: any) {
            console.error(`Failed to delete PDF from S3: ${deleteError.message}`);
            // Continue even if deletion fails
          }
        }

        // Update job and clear PDF URL (mark as processed)
        await updateScrapeJob(input.jobId, {
          toursImported: input.tours.length,
          pdfUrl: null,
        });

        return {
          success: true,
          imported: input.tours.length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Import failed: ${error.message}`,
        });
      }
    }),

  // Update scrape job info (name, url, agency, category)
  updateScrapeJobInfo: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        title: z.string().optional(),
        price: z.number().optional(),
        agencyId: z.number().optional(),
        category: z.enum(["japan", "asia", "long_haul", "china_long_haul", "guangdong"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { updateScrapeJobInfo } = await import("../db");
      await updateScrapeJobInfo(id, updateData);
      return { success: true };
    }),

  // Delete single scrape job
  deleteScrapeJob: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const { deleteScrapeJob } = await import("../db");
        await deleteScrapeJob(input.id);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Delete failed: ${error.message}`,
        });
      }
    }),

  // Bulk delete scrape jobs
  bulkDeleteScrapeJobs: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      try {
        const { deleteScrapeJob } = await import("../db");
        await Promise.all(input.ids.map((id) => deleteScrapeJob(id)));
        return { success: true, deleted: input.ids.length };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Bulk delete failed: ${error.message}`,
        });
      }
    }),

  // Upload agency logo
  uploadAgencyLogo: adminProcedure
    .input(
      z.object({
        agencyId: z.number(),
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { storagePut } = await import("../storage");
        const sharp = (await import("sharp")).default;
        
        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        // Compress image to approximately 100KB
        // Start with quality 80 and adjust if needed
        let compressedBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        
        // If still larger than 100KB, reduce quality further
        let quality = 80;
        while (compressedBuffer.length > 100 * 1024 && quality > 20) {
          quality -= 10;
          compressedBuffer = await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, progressive: true })
            .toBuffer();
        }
        
        
        // Generate random suffix for security
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileKey = `agency-logos/${input.agencyId}-${randomSuffix}.jpg`;
        
        // Upload compressed image to S3
        const { url } = await storagePut(fileKey, compressedBuffer, "image/jpeg");
        
        // Update agency logoUrl in database
        const { updateAgencyLogo } = await import("../db");
        await updateAgencyLogo(input.agencyId, url);
        
        return {
          success: true,
          logoUrl: url,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Upload failed: ${error.message}`,
        });
      }
    }),

  // Upload PDF for preview (on-demand)
  uploadPdfForPreview: adminProcedure
    .input(
      z.object({
        jobId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const job = await getScrapeJobById(input.jobId);
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Check if already uploaded
        if (job.pdfUrl) {
          return {
            success: true,
            pdfUrl: job.pdfUrl,
            alreadyUploaded: true,
          };
        }

        // Check if sourceUrl exists (PDF)
        if (!job.sourceUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No PDF source URL found",
          });
        }

        // Download PDF
        const pdfResponse = await fetch(job.sourceUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
        }
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        // Upload to S3
        const { storagePut } = await import("../storage");
        const pdfKey = `scrape-jobs/${input.jobId}/${Date.now()}.pdf`;
        const uploadResult = await storagePut(pdfKey, pdfBuffer, "application/pdf");

        // Update job with PDF URL
        await updateScrapeJob(input.jobId, {
          pdfUrl: uploadResult.url,
        });

        return {
          success: true,
          pdfUrl: uploadResult.url,
          alreadyUploaded: false,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `PDF upload failed: ${error.message}`,
        });
      }
    }),

  // Delete agency (and cascade delete all related tours)
  deleteAgency: adminProcedure
    .input(
      z.object({
        agencyId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { deleteAgency } = await import("../db");
      await deleteAgency(input.agencyId);
      return { success: true };
    }),

  // Get all tours for management
  getAllTours: adminProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getAllTours } = await import("../db");
      return await getAllTours(input);
    }),

  // Update tour
  updateTour: adminProcedure
    .input(
      z.object({
        tourId: z.number(),
        title: z.string().optional(),
        destination: z.string().optional(),
        days: z.number().optional(),
        nights: z.number().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        departureDate: z.string().optional(),
        tourType: z.enum(["pure_play", "luxury", "cruise", "budget", "family"]).optional(),
        imageUrl: z.string().optional(),
        sourceUrl: z.string().optional(),
        pdfUrl: z.string().optional(),
        agencyName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { tourId, ...data } = input;
      const { updateTour } = await import("../db");
      await updateTour(tourId, data);
      return { success: true };
    }),

  // Delete tour
  deleteTour: adminProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { deleteTour } = await import("../db");
      await deleteTour(input.tourId);
      return { success: true };
    }),

  batchDeleteTours: adminProcedure
    .input(
      z.object({
        tourIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const { deleteTour } = await import("../db");
      // Delete tours one by one
      for (const tourId of input.tourIds) {
        await deleteTour(tourId);
      }
      return { success: true, deletedCount: input.tourIds.length };
    }),

  // User Management
  getAllUsers: adminProcedure.query(async () => {
    const { getAllUsers } = await import("../db");
    return await getAllUsers();
  }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { updateUserInfo } = await import("../db");
      await updateUserInfo(input.userId, {
        name: input.name,
        email: input.email,
        role: input.role,
      });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteUserById } = await import("../db");
      await deleteUserById(input.userId);
      return { success: true };
    }),

  // Bulk delete users
  bulkDeleteUsers: adminProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { bulkDeleteUsers } = await import("../db");
      await bulkDeleteUsers(input.userIds);
      return { success: true, deletedCount: input.userIds.length };
    }),

  // Suspend or activate user
  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["active", "suspended"]),
      })
    )
    .mutation(async ({ input }) => {
      const { updateUserStatus } = await import("../db");
      await updateUserStatus(input.userId, input.status);
      return { success: true };
    }),

  // Extract contact info from content and update agency
  extractAndUpdateContact: adminProcedure
    .input(
      z.object({
        content: z.string(),
        agencyId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { extractContactInfo } = await import("../contactExtractor");
      const { updateAgency, getAgencyById } = await import("../db");
      
      // 提取聯絡方式
      const extracted = await extractContactInfo(input.content);
      
      // 獲取現有旅行社資料
      const agency = await getAgencyById(input.agencyId);
      if (!agency) {
        throw new TRPCError({ code: "NOT_FOUND", message: "旅行社不存在" });
      }
      
      // 檢查是否需要更新
      const needsUpdate = 
        (extracted.whatsapp && extracted.whatsapp !== agency.whatsapp) ||
        (extracted.phone && extracted.phone !== agency.phone);
      
      if (needsUpdate) {
        // 更新旅行社資料
        await updateAgency(input.agencyId, {
          whatsapp: extracted.whatsapp || agency.whatsapp || undefined,
          phone: extracted.phone || agency.phone || undefined,
        });
      }
      
      return {
        success: true,
        extracted,
        updated: needsUpdate,
      };
    }),

  // Direct scrape URL without creating job first
  scrapeUrl: adminProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        let content: string;
        let sourceType: string;
        let sourceUrl: string | null = null;

        // Check if URL is a PDF file or a listing page
        const { isPDFUrl, extractTextFromPDF } = await import("../pdfParser");
        const { discoverPDFsFromListing } = await import("../pdfDiscovery");
        
        if (isPDFUrl(input.url)) {
          // Extract text from PDF
          sourceUrl = input.url;
          content = await extractTextFromPDF(input.url);
          sourceType = "PDF";
        } else if (input.url.includes("/tour-line/") || input.url.includes("/tours") || input.url.includes("/list")) {
          // Detected listing page
          
          try {
            const { scrapeListingWithDetails } = await import("../deepLinkScraper");
            const deepScrapeResult = await scrapeListingWithDetails(input.url, 5);
            
            if (deepScrapeResult.detailPages.length > 0) {
              content = deepScrapeResult.combinedContent;
              sourceType = "deep_scrape";
            } else {
              const discoveredPdfs = await discoverPDFsFromListing(input.url, 5);
              
              if (discoveredPdfs && discoveredPdfs.length > 0) {
                const firstPdf = discoveredPdfs[0];
                if (firstPdf && firstPdf.url) {
                  sourceUrl = firstPdf.url;
                  content = await extractTextFromPDF(firstPdf.url);
                  sourceType = "PDF (discovered)";
                } else {
                  const { smartScrape } = await import("../scraper");
                  const { html, method } = await smartScrape(input.url);
                  content = html;
                  sourceType = method;
                }
              } else {
                const { smartScrape } = await import("../scraper");
                const { html, method } = await smartScrape(input.url);
                content = html;
                sourceType = method;
              }
            }
          } catch (deepScrapeError: any) {
            console.error(`Deep scrape failed: ${deepScrapeError.message}`);
            const { smartScrape } = await import("../scraper");
            const { html, method } = await smartScrape(input.url);
            content = html;
            sourceType = method;
          }
        } else {
          const { smartScrape } = await import("../scraper");
          const { html, method } = await smartScrape(input.url);
          content = html;
          sourceType = method;
        }

        // Use LLM to extract tour information
        
        const llmResponse = await invokeLLM({
          max_tokens: 4000, // 增加 token 限制以支持更長的回應
          messages: [
            {
              role: "system",
              content: `You are a tour information extraction assistant. Extract tour package information from various content formats (HTML, PDF text, OCR text) and return structured JSON data.

IMPORTANT:
- The content may be from OCR (image-to-text), so text formatting might be imperfect
- Look for tour information even if the text structure is messy
- Be flexible with date formats and number formats
              
For each tour found, extract:

**基本信息（必填）：**
- title: Tour title/name (required)
- destination: Destination country/city (required)
- days: Number of days (integer, required)
- nights: Number of nights (integer, required)
- price: Price in HKD (decimal number only, no currency symbol, required)

**行程信息（盡量提取，找不到则用空字符串）：**
- highlights: Tour highlights, key attractions, special activities (string)
- itinerary: Detailed day-by-day itinerary (string)
- inclusions: What's included in the price (flights, hotels, meals, tickets, etc.) (string)
- exclusions: What's NOT included (visa fees, tips, optional activities, etc.) (string)

**住宿與餐食（盡量提取，找不到则用空字符串）：**
- hotels: Hotel arrangements (hotel names, star ratings, locations) (string)
- meals: Meal arrangements (breakfast, lunch, dinner details) (string)

**其他信息（可選）：**
- departureDate: Departure date (ISO format YYYY-MM-DD, use empty string if not found)
- imageUrl: Image URL (string, use empty string if not found)
- whatsapp: WhatsApp contact number (string, use empty string if not found)
- phone: Phone contact number (string, use empty string if not found)

Return a JSON array of tour objects. If no tours found, return empty array.`,
            },
            {
              role: "user",
              content: `Extract tour information from this content (${sourceType}):\n\n${content.slice(0, 50000)}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tour_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        destination: { type: "string" },
                        days: { type: "integer" },
                        nights: { type: "integer" },
                        price: { type: "number" },
                        departureDate: { type: "string" },
                        highlights: { type: "string" },
                        itinerary: { type: "string" },
                        inclusions: { type: "string", description: "What's included in the price or empty string" },
                        exclusions: { type: "string", description: "What's NOT included or empty string" },
                        hotels: { type: "string", description: "Hotel arrangements or empty string" },
                        meals: { type: "string", description: "Meal arrangements or empty string" },
                        imageUrl: { type: "string" },
                        whatsapp: { type: "string" },
                        phone: { type: "string" },
                      },
                      required: ["title", "destination", "days", "nights"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tours"],
                additionalProperties: false,
              },
            },
          },
        });

        const llmContent = llmResponse.choices[0]?.message?.content;
        if (!llmContent || typeof llmContent !== 'string') {
          throw new Error("No content in LLM response");
        }

        let parsedData;
        try {
          parsedData = JSON.parse(llmContent);
        } catch (parseError: any) {
          console.error(`[Direct Scraper] JSON parse error: ${parseError.message}`);
          console.error(`[Direct Scraper] Problematic JSON (first 1000 chars): ${llmContent.slice(0, 1000)}`);
          console.error(`[Direct Scraper] Problematic JSON (last 1000 chars): ${llmContent.slice(-1000)}`);
          
          // 嘗試修復不完整的 JSON
          try {
            // 尋找最後一個完整的旅行團物件
            const lastCompleteObjectIndex = llmContent.lastIndexOf('},');
            if (lastCompleteObjectIndex > 0) {
              const truncatedContent = llmContent.slice(0, lastCompleteObjectIndex + 1) + ']}';
              parsedData = JSON.parse(truncatedContent);
            } else {
              throw parseError;
            }
          } catch (retryError) {
            throw new Error(`Failed to parse LLM response as JSON: ${parseError.message}`);
          }
        }
        const tours = parsedData?.tours || [];

        return {
          success: true,
          toursFound: tours.length,
          tours,
          sourceUrl,
          usedOcr: sourceType.includes("OCR") || sourceType.includes("image"),
          extractedLength: content.length,
          sourceType,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `抓取失敗：${error.message}`,
        });
      }
    }),

  // Remove duplicate tours
  removeDuplicates: adminProcedure.mutation(async () => {
    const { removeDuplicateTours } = await import("../db");
    const deletedCount = await removeDuplicateTours();
    return {
      success: true,
      deletedCount,
      message: `已刪除 ${deletedCount} 個重複旅行團`,
    };
  }),

  // Get all image categories
  getImageCategories: adminProcedure.query(async () => {
    const categories = await getAllImageCategories();
    return categories;
  }),

  // Update image category keywords
  updateImageKeywords: adminProcedure
    .input(
      z.object({
        id: z.number(),
        keywords: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await updateImageCategoryKeywords(input.id, input.keywords);
      return {
        success: true,
        message: "關鍵字已更新",
      };
    }),

  // Update image category image (upload new image)
  updateImageFile: adminProcedure
    .input(
      z.object({
        id: z.number(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await updateImageCategoryImage(input.id, input.imageUrl);
      return {
        success: true,
        message: "圖片已更換",
      };
    }),

  // Create new image category
  createImageCategory: adminProcedure
    .input(
      z.object({
        name: z.string(),
        keywords: z.string(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const newCategory = await createImageCategory(input);
      return {
        success: true,
        category: newCategory,
        message: "圖片分類已新增",
      };
    }),

  deleteImageCategory: adminProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { deleteImageCategory } = await import("../db");
      await deleteImageCategory(input.id);
      return {
        success: true,
        message: "圖片分類已刪除",
      };
    }),

  // Create manual tour
  createManualTour: adminProcedure
    .input(
      z.object({
        agencyId: z.number(),
        title: z.string(),
        destination: z.string(),
        days: z.number(),
        nights: z.number(),
        price: z.number(),
        originalPrice: z.number().optional(),
        departureDate: z.string().optional(),
        returnDate: z.string().optional(),
        highlights: z.string().optional(),
        itinerary: z.string().optional(),
        includes: z.string().optional(),
        excludes: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { bulkInsertTours } = await import("../db");
      
      const tourData = {
        ...input,
        price: input.price.toString(),
        originalPrice: input.originalPrice?.toString(),
        status: "active" as const,
        rating: "0",
        reviewCount: 0,
        viewCount: 0,
        isNoShopping: false,
        tourType: "budget" as const,
      };

      await bulkInsertTours([tourData]);

      return {
        success: true,
        message: "旅行團已成功創建",
      };
    }),

  // ==================== Advertisement Management ====================

  /**
   * 創建廣告（將旅行團或旅行社設為推薦）
   */
  createAdvertisement: adminProcedure
    .input(
      z.object({
        type: z.enum(["tour", "agency"]),
        tourId: z.number().optional(),
        agencyId: z.number().optional(),
        placement: z.enum(["home_top", "recommendations_top", "favorites_top", "search_top", "notifications_top"]),
        durationDays: z.number().default(30), // 廣告持續天數
        priority: z.number().default(0),
        imageUrl: z.string().optional(), // 廣告圖片 URL
        linkUrl: z.string().optional(), // 跳轉鏈結 URL
      })
    )
    .mutation(async ({ input }) => {
      const { createAdvertisement } = await import("../db");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.durationDays);

      await createAdvertisement({
        type: input.type,
        tourId: input.tourId,
        agencyId: input.agencyId,
        placement: input.placement,
        startDate,
        endDate,
        priority: input.priority,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
      });

      return { success: true, message: "廣告已創建" };
    }),

  /**
   * 暫停/啟用廣告
   */
  toggleAdStatus: adminProcedure
    .input(z.object({ adId: z.number(), status: z.enum(["active", "paused"]) }))
    .mutation(async ({ input }) => {
      const { toggleAdStatus } = await import("../db");
      await toggleAdStatus(input.adId, input.status);
      return { success: true, message: input.status === "active" ? "廣告已啟用" : "廣告已暫停" };
    }),

  /**
   * 刪除廣告
   */
  deleteAdvertisement: adminProcedure
    .input(z.object({ adId: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteAdvertisement } = await import("../db");
      await deleteAdvertisement(input.adId);
      return { success: true, message: "廣告已刪除" };
    }),

  /**
   * 獲取廣告統計數據
   */
  getAdStatistics: adminProcedure
    .input(z.object({ adId: z.number() }))
    .query(async ({ input }) => {
      const { getAdStatistics } = await import("../db");
      return await getAdStatistics(input.adId);
    }),

  /**
   * 獲取所有活躍廣告及統計
   */
  getActiveAdvertisements: adminProcedure
    .query(async () => {
      const { getActiveAdvertisements, getAdStatistics } = await import("../db");
      // 獲取所有四個位置的廣告
      const homeAds = await getActiveAdvertisements("home_top", 100);
      const recommendationsAds = await getActiveAdvertisements("recommendations_top", 100);
      const favoritesAds = await getActiveAdvertisements("favorites_top", 100);
      const searchAds = await getActiveAdvertisements("search_top", 100);
      const allAds = [...homeAds, ...recommendationsAds, ...favoritesAds, ...searchAds];
      
      // 獲取每個廣告的統計數據
      const adsWithStats = await Promise.all(
        allAds.map(async (ad) => {
          const stats = await getAdStatistics(ad.id);
          return {
            ...ad,
            clicks: stats.clicks,
            impressions: stats.impressions,
          };
        })
      );
      
      return adsWithStats;
    }),

  /**
   * 追蹤廣告點擊
   */
  trackAdClick: protectedProcedure
    .input(z.object({ advertisementId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { trackAdClick } = await import("../db");
      await trackAdClick({
        advertisementId: input.advertisementId,
        userId: ctx.user?.id,
        sessionId: (ctx.req as any).sessionID || undefined,
        ipAddress: ctx.req.ip || undefined,
        userAgent: ctx.req.headers["user-agent"] || undefined,
        referrer: ctx.req.headers["referer"] || undefined,
      });
      return { success: true };
    }),

  // ==================== 圖片追蹤系統 ====================

  /**
   * 獲取圖片使用統計
   */
  getImageStats: adminProcedure
    .query(async () => {
      const { getImageStats } = await import("../imageTracking");
      return await getImageStats();
    }),

  /**
   * 獲取未使用的圖片列表
   */
  getUnusedImages: adminProcedure
    .query(async () => {
      const { findUnusedImages } = await import("../imageTracking");
      return await findUnusedImages();
    }),

  /**
   * 清理指定的圖片
   */
  cleanupImages: adminProcedure
    .input(z.object({
      fileNames: z.array(z.string()),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { deleteImages } = await import("../imageTracking");
      const result = await deleteImages(input.fileNames, 'manual', input.reason);
      
      if (result.failed > 0) {
        return {
          success: false,
          message: `成功刪除 ${result.success} 個檔案，失敗 ${result.failed} 個`,
          errors: result.errors,
        };
      }
      
      return {
        success: true,
        message: `成功刪除 ${result.success} 個圖片檔案`,
      };
    }),

  /**
   * 獲取清理歷史
   */
  getCleanupHistory: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const { getCleanupHistory } = await import("../imageTracking");
      return await getCleanupHistory(input.limit);
    }),

  /**
   * 導入提取的旅行團資訊
   */
  importExtractedTours: adminProcedure
    .input(z.object({
      tours: z.array(z.object({
        title: z.string(),
        destination: z.string(),
        price: z.number(),
        days: z.number().optional(),
        nights: z.number().optional(),
        highlights: z.string().optional(),
        pdfUrl: z.string().optional(),
        whatsapp: z.string().optional(),
        phone: z.string().optional(),
      })),
      agencyName: z.string().optional(),
      agencyId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "無法連接數據庫",
          });
        }
        
        const { agencies, tours: toursTable } = await import("../../drizzle/schema");
        
        // 使用提供的 agencyName 查找或創建旅行社
        const targetAgencyName = input.agencyName || "其他";
        let targetAgency = await db.select().from(agencies).where(eq(agencies.name, targetAgencyName)).limit(1);
        
        let agencyId: number;
        if (targetAgency.length === 0) {
          // 創建新旅行社
          const result: any = await db.insert(agencies).values({
            name: targetAgencyName,
          });
          // result 是數組，使用 result[0].insertId
          agencyId = Number(result[0].insertId);
          console.log(`[importExtractedTours] Created new agency "${targetAgencyName}" with ID: ${agencyId}`);
        } else {
          agencyId = targetAgency[0].id;
          console.log(`[importExtractedTours] Using existing agency "${targetAgencyName}" with ID: ${agencyId}`);
        }
        
        // 確認 agencyId 有效
        if (!agencyId || isNaN(agencyId)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `無效的旅行社 ID: ${agencyId}`,
          });
        }
        
        // 導入旅行團
        const toursToInsert = input.tours.map(tour => ({
          agencyId,
          title: tour.title,
          destination: tour.destination,
          days: tour.days || 0,
          nights: tour.nights || 0,
          tourType: "pure_play" as const, // 預設為純玩團
          price: tour.price.toString(),
          departureDate: new Date(), // 預設為今天
          returnDate: new Date(Date.now() + (tour.days || 1) * 24 * 60 * 60 * 1000), // 根據天數計算
          itinerary: tour.highlights || "待補充",
          affiliateLink: tour.pdfUrl || "",
          highlights: tour.highlights || null,
          sourceUrl: tour.pdfUrl || null,
          status: "active" as const, // 預設為活躍狀態
          isPublished: true, // 預設發佈，立即顯示在前端
        }));
        
        await db.insert(toursTable).values(toursToInsert);
        
        return {
          success: true,
          message: `成功導入 ${input.tours.length} 個旅行團到「${targetAgencyName}」旅行社`,
          imported: input.tours.length,
          agencyId,
          agencyName: targetAgencyName,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `導入失敗: ${error.message}`,
        });
      }
    }),

  /**
   * 上傳廣告圖片（壓縮到 100KB）
   */
  uploadAdImage: adminProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { storagePut } = await import("../storage");
        const sharp = (await import("sharp")).default;
        
        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        // Compress image to approximately 100KB
        // Start with quality 80 and adjust if needed
        let compressedBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        
        // If still larger than 100KB, reduce quality further
        let quality = 80;
        while (compressedBuffer.length > 100 * 1024 && quality > 20) {
          quality -= 10;
          compressedBuffer = await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, progressive: true })
            .toBuffer();
        }
        
        // Generate random suffix for security
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const fileKey = `ad-images/${timestamp}-${randomSuffix}.jpg`;
        
        // Upload compressed image to S3
        const { url } = await storagePut(fileKey, compressedBuffer, "image/jpeg");
        
        return {
          success: true,
          imageUrl: url,
          fileSize: compressedBuffer.length,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `上傳失敗: ${error.message}`,
        });
      }
    }),
});

