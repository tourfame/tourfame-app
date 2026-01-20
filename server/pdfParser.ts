import { PDFParse } from "pdf-parse";
import { convertPdfToImages, extractTextFromImages } from "./services/pdfToImage";

/**
 * Download and parse PDF from URL with smart fallback
 * First tries text extraction, then falls back to OCR if text is empty
 * @param pdfUrl - URL of the PDF file
 * @returns Extracted text content from PDF
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  const startTime = Date.now();
  try {
    
    // Step 1: Download PDF
    let pdfBuffer: Buffer;
    try {
      const https = await import('https');
      const agent = new https.Agent({ rejectUnauthorized: false });
      const response = await fetch(pdfUrl, { 
        agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      } as any);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } catch (downloadError: any) {
      console.error(`[PDF Parser] Download failed:`, downloadError.message);
      throw new Error(`PDF 下載失敗：${downloadError.message}`);
    }
    
    // Step 2: Try text extraction first
    let extractedText = "";
    try {
      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      extractedText = result.text.trim();
      
      // Log a preview of extracted text
      if (extractedText.length > 0) {
      }
    } catch (textError: any) {
      console.error(`[PDF Parser] Text extraction failed:`, textError.message);
      console.error(`[PDF Parser] Error stack:`, textError.stack);
    }
    
    // Step 3: If text is empty or too short, use OCR
    // Threshold: 100 characters (adjustable based on testing)
    if (extractedText.length < 100) {
      
      try {
        // Convert PDF to images (max 15 pages for better coverage)
        const imageUrls = await convertPdfToImages(pdfUrl, 15);
        
        if (imageUrls.length === 0) {
          throw new Error("PDF 轉圖片失敗：未生成任何圖片");
        }
        
        
        // Extract text from images using LLM Vision
        const ocrText = await extractTextFromImages(imageUrls);
        
        if (ocrText.length > extractedText.length) {
          const elapsedTime = Date.now() - startTime;
          return ocrText;
        } else {
        }
      } catch (ocrError: any) {
        console.error(`[PDF Parser] OCR fallback failed:`, ocrError.message);
        console.error(`[PDF Parser] OCR error stack:`, ocrError.stack);
        // Continue with whatever text we have
      }
    }
    
    if (extractedText.length === 0) {
      throw new Error("無法從 PDF 中提取文字（文字提取和 OCR 識別均失敗）。可能原因：PDF 已加密、格式損壞或內容為純圖片且 OCR 失敗");
    }
    
    const elapsedTime = Date.now() - startTime;
    return extractedText;
    
  } catch (error: any) {
    console.error(`[PDF Parser] Error extracting text from PDF:`, error);
    throw new Error(`PDF 解析失敗：${error.message}`);
  }
}

/**
 * Extract text from PDF buffer
 * @param buffer - PDF file buffer
 * @returns Extracted text content from PDF
 */
export async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    
    // Create parser with buffer
    const parser = new PDFParse({ data: buffer });
    
    // Extract text
    const result = await parser.getText();
    
    
    return result.text;
  } catch (error: any) {
    console.error(`[PDF Parser] Error extracting text from PDF buffer:`, error);
    throw new Error(`PDF 解析失敗：${error.message}`);
  }
}

/**
 * Check if URL is a PDF file
 * @param url - URL to check
 * @returns True if URL points to a PDF file
 */
export function isPDFUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.pdf') || urlLower.includes('.pdf?');
}

/**
 * Find PDF links in HTML content
 * @param html - HTML content to search
 * @param baseUrl - Base URL for resolving relative links
 * @returns Array of PDF URLs found
 */
export function findPDFLinks(html: string, baseUrl: string): string[] {
  const pdfLinks: string[] = [];
  
  // Match href attributes that point to PDF files
  const hrefRegex = /href=["']([^"']+\.pdf[^"']*)["']/gi;
  let match;
  
  while ((match = hrefRegex.exec(html)) !== null) {
    const pdfUrl = match[1];
    
    // Resolve relative URLs
    try {
      const absoluteUrl = new URL(pdfUrl, baseUrl).href;
      if (!pdfLinks.includes(absoluteUrl)) {
        pdfLinks.push(absoluteUrl);
      }
    } catch (error) {
      console.warn(`[PDF Parser] Invalid PDF URL: ${pdfUrl}`);
    }
  }
  
  return pdfLinks;
}
