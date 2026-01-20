import { fromPath } from "pdf2pic";
import { storagePut } from "../storage";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Convert PDF to images and upload to S3
 * @param pdfUrl - URL of the PDF file to convert
 * @param maxPages - Maximum number of pages to convert (default: 10)
 * @returns Array of S3 image URLs
 */
export async function convertPdfToImages(
  pdfUrl: string,
  maxPages: number = 10
): Promise<string[]> {
  const tempDir = path.join(os.tmpdir(), `pdf-${Date.now()}`);
  
  try {
    
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Download PDF to temp file
    const pdfPath = path.join(tempDir, "input.pdf");
    // Use Node.js https module with rejectUnauthorized: false to handle SSL issues
    const https = await import('https');
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await fetch(pdfUrl, { agent } as any);
    if (!response.ok) {
      throw new Error(`下載 PDF 失敗: ${response.statusText}`);
    }
    
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Configure pdf2pic
    const options = {
      density: 100,           // DPI
      saveFilename: "page",   // Output filename prefix
      savePath: tempDir,      // Output directory
      format: "png",          // Output format
      width: 1200,            // Width in pixels
      height: 1600,           // Height in pixels
    };
    
    const converter = fromPath(pdfPath, options);
    
    // Convert pages to images
    const imageUrls: string[] = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        
        const result = await converter(pageNum, { responseType: "image" });
        
        if (!result || !result.path) {
          break; // No more pages
        }
        
        // Read image file
        const imagePath = result.path;
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Upload to S3
        const s3Key = `pdf-images/${Date.now()}-page-${pageNum}.png`;
        const { url } = await storagePut(s3Key, imageBuffer, "image/png");
        
        imageUrls.push(url);
        
      } catch (pageError: any) {
        console.error(`[PDF to Image] Error converting page ${pageNum}:`, pageError.message);
        break; // Stop on first error (likely no more pages)
      }
    }
    
    return imageUrls;
    
  } catch (error: any) {
    console.error(`[PDF to Image] Error:`, error);
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  } finally {
    // Clean up temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.warn(`[PDF to Image] Failed to clean up temp directory:`, cleanupError);
    }
  }
}

/**
 * Extract text from images using LLM Vision API
 * @param imageUrls - Array of image URLs
 * @returns Extracted text content
 */
export async function extractTextFromImages(imageUrls: string[]): Promise<string> {
  try {
    
    const { invokeLLM } = await import("../_core/llm");
    
    // Process each image
    const extractedTexts: string[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts text from images. Extract all visible text from the image, preserving the layout and structure as much as possible.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all text from this image. Include tour titles, destinations, prices, dates, and any other relevant information.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
      });
      
      const messageContent = response.choices[0]?.message?.content;
      const extractedText = typeof messageContent === "string" ? messageContent : "";
      extractedTexts.push(extractedText);
      
    }
    
    // Combine all extracted text
    const combinedText = extractedTexts.join("\n\n--- Page Break ---\n\n");
    
    return combinedText;
    
  } catch (error: any) {
    console.error(`[Image OCR] Error:`, error);
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}
