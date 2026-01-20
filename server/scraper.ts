import puppeteer from "puppeteer";
import { execSync } from "child_process";
import { existsSync } from "fs";

/**
 * 使用 Puppeteer 無頭瀏覽器爬取網頁內容
 * 支持動態載入的網站（JavaScript渲染）
 */
export async function scrapeWithBrowser(url: string): Promise<string> {
  let browser;
  try {
    // 設置 Puppeteer 緩存路徑環境變數
    process.env.PUPPETEER_CACHE_DIR = "/home/ubuntu/.cache/puppeteer";
    
    // 查找 Chrome 可執行文件路徑
    let executablePath: string | undefined;
    const possiblePaths = [
      "/home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.192/chrome-linux64/chrome",
      "/home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome",
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        executablePath = path;
        break;
      } else {
      }
    }
    
    if (!executablePath) {
      const errorMsg = "Could not find Chrome executable. Checked paths: " + possiblePaths.join(", ");
      console.error(`[Puppeteer] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    
    // 啟動無頭瀏覽器
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // 設置用戶代理，模擬真實瀏覽器
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 設置視口大小
    await page.setViewport({ width: 1920, height: 1080 });

    // 訪問目標網頁，等待網絡空閒
    await page.goto(url, {
      waitUntil: "networkidle2", // 等待網絡空閒（最多2個連接）
      timeout: 30000, // 30秒超時
    });

    // 等待額外2秒，確保動態內容載入完成
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 獲取頁面的完整 HTML
    const html = await page.content();

    return html;
  } catch (error) {
    console.error("Puppeteer scraping error:", error);
    throw new Error(
      `Failed to scrape with browser: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // 確保瀏覽器關閉
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 使用傳統 fetch 爬取網頁內容
 * 適用於靜態網站（內容在初始 HTML 中）
 */
export async function scrapeWithFetch(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error("Fetch scraping error:", error);
    throw new Error(
      `Failed to scrape with fetch: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * 智能爬取函數：先嘗試 fetch，失敗則使用 Puppeteer
 * 平衡速度和成功率
 */
export async function smartScrape(url: string): Promise<{
  html: string;
  method: "fetch" | "browser";
}> {
  // 先嘗試快速的 fetch 方法
  try {
    const html = await scrapeWithFetch(url);
    // 簡單檢查：如果 HTML 太短，可能是空框架
    if (html.length < 1000) {
      throw new Error("HTML content too short, likely empty framework");
    }
    return { html, method: "fetch" };
  } catch (fetchError) {
    // fetch 失敗，使用 Puppeteer
    const html = await scrapeWithBrowser(url);
    return { html, method: "browser" };
  }
}
