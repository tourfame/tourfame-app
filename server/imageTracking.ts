import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import { tours, imageCleanupLogs } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * 圖片追蹤工具函數
 */

export interface ImageInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ImageStats {
  total: number;
  used: number;
  unused: number;
  totalSize: number;
  unusedSize: number;
}

/**
 * 掃描圖片目錄，獲取所有圖片文件
 */
export async function scanImageFiles(): Promise<ImageInfo[]> {
  const imagesDir = path.join(process.cwd(), 'client/public/tour-images');
  
  try {
    // 確保目錄存在
    if (!fs.existsSync(imagesDir)) {
      return [];
    }

    const files = fs.readdirSync(imagesDir);
    const imageFiles: ImageInfo[] = [];

    for (const fileName of files) {
      // 只處理以 tour- 開頭的圖片文件
      if (!fileName.startsWith('tour-')) {
        continue;
      }

      const filePath = path.join(imagesDir, fileName);
      const stats = fs.statSync(filePath);

      imageFiles.push({
        fileName,
        filePath,
        fileSize: stats.size,
        uploadedAt: stats.birthtime,
      });
    }

    return imageFiles;
  } catch (error) {
    console.error('[Image Tracking] Error scanning image files:', error);
    return [];
  }
}

/**
 * 從數據庫獲取所有被使用的圖片
 */
export async function getUsedImages(): Promise<Set<string>> {
  try {
    const db = await getDb();
    if (!db) return new Set();
    
    const result = await db
      .select({ imageUrl: tours.imageUrl })
      .from(tours)
      .where(sql`${tours.imageUrl} IS NOT NULL AND ${tours.imageUrl} != ''`);

    const usedImages = new Set<string>();
    
    for (const row of result) {
      if (row.imageUrl && row.imageUrl.startsWith('/tour-images/')) {
        const fileName = row.imageUrl.replace('/tour-images/', '');
        usedImages.add(fileName);
      }
    }

    return usedImages;
  } catch (error) {
    console.error('[Image Tracking] Error getting used images:', error);
    return new Set();
  }
}

/**
 * 找出未被使用的圖片
 */
export async function findUnusedImages(): Promise<ImageInfo[]> {
  const allImages = await scanImageFiles();
  const usedImages = await getUsedImages();

  const unusedImages = allImages.filter(img => !usedImages.has(img.fileName));
  
  return unusedImages;
}

/**
 * 獲取圖片使用統計
 */
export async function getImageStats(): Promise<ImageStats> {
  const allImages = await scanImageFiles();
  const usedImages = await getUsedImages();

  const totalSize = allImages.reduce((sum, img) => sum + img.fileSize, 0);
  const unusedImages = allImages.filter(img => !usedImages.has(img.fileName));
  const unusedSize = unusedImages.reduce((sum, img) => sum + img.fileSize, 0);

  return {
    total: allImages.length,
    used: usedImages.size,
    unused: unusedImages.length,
    totalSize,
    unusedSize,
  };
}

/**
 * 刪除指定的圖片文件
 */
export async function deleteImages(
  fileNames: string[],
  deletedBy: 'auto' | 'manual',
  reason?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const fileName of fileNames) {
    try {
      const filePath = path.join(process.cwd(), 'client/public/tour-images', fileName);
      
      // 檢查文件是否存在
      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${fileName}`);
        failed++;
        continue;
      }

      // 獲取文件大小
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // 刪除文件
      fs.unlinkSync(filePath);

      // 記錄到數據庫
      const db = await getDb();
      if (db) {
        await db.insert(imageCleanupLogs).values({
          fileName,
          filePath,
          fileSize,
          deletedBy,
          reason: reason || `Deleted by ${deletedBy} cleanup`,
        });
      }

      success++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to delete ${fileName}: ${errorMsg}`);
      failed++;
    }
  }

  return { success, failed, errors };
}

/**
 * 獲取清理歷史記錄
 */
export async function getCleanupHistory(limit: number = 50) {
  try {
    const db = await getDb();
    if (!db) return [];
    
    const history = await db
      .select()
      .from(imageCleanupLogs)
      .orderBy(sql`${imageCleanupLogs.deletedAt} DESC`)
      .limit(limit);

    return history;
  } catch (error) {
    console.error('[Image Tracking] Error getting cleanup history:', error);
    return [];
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
