/**
 * PDF Downloader Module
 * Download PDF files and upload to S3 storage
 */

import { storagePut } from "./storage";

export interface PDFDownloadResult {
  success: boolean;
  s3Url?: string;
  s3Key?: string;
  error?: string;
}

/**
 * Download PDF from URL and upload to S3
 * @param pdfUrl - URL of the PDF file
 * @param jobId - Scrape job ID for organizing files
 * @returns Result with S3 URL or error
 */
export async function downloadAndUploadPDF(
  pdfUrl: string,
  jobId: number
): Promise<PDFDownloadResult> {
  try {

    // Download PDF
    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("pdf")) {
      console.warn(`[PDF Downloader] Warning: Content-Type is ${contentType}, expected PDF`);
    }

    // Get PDF buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);


    // Generate S3 key with job ID and timestamp
    const timestamp = Date.now();
    const s3Key = `pdfs/job-${jobId}-${timestamp}.pdf`;

    // Upload to S3
    const uploadResult = await storagePut(s3Key, buffer, "application/pdf");


    return {
      success: true,
      s3Url: uploadResult.url,
      s3Key: s3Key,
    };
  } catch (error) {
    console.error(`[PDF Downloader] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Download multiple PDFs and upload to S3
 * @param pdfUrls - Array of PDF URLs
 * @param jobId - Scrape job ID
 * @returns Array of results
 */
export async function downloadAndUploadMultiplePDFs(
  pdfUrls: string[],
  jobId: number
): Promise<PDFDownloadResult[]> {
  const results: PDFDownloadResult[] = [];

  for (const pdfUrl of pdfUrls) {
    const result = await downloadAndUploadPDF(pdfUrl, jobId);
    results.push(result);

    // Add delay between downloads to avoid overwhelming servers
    if (results.length < pdfUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
