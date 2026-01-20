/**
 * 自動清理未使用的圖片
 * 每週日凌晨 2:00 執行
 */

import { findUnusedImages, deleteImages } from '../imageTracking';

/**
 * 執行圖片清理任務
 * 只刪除上傳超過 7 天且未被使用的圖片（安全期機制）
 */
export async function cleanupUnusedImagesTask() {
  try {
    // 獲取所有未使用的圖片
    const unusedImages = await findUnusedImages();
    
    if (unusedImages.length === 0) {
      return {
        success: true,
        message: '沒有需要清理的圖片',
        deleted: 0,
      };
    }

    // 過濾出上傳超過 7 天的圖片（安全期）
    const now = new Date();
    const safetyPeriodDays = 7;
    const safetyPeriodMs = safetyPeriodDays * 24 * 60 * 60 * 1000;
    
    const imagesToDelete = unusedImages.filter(img => {
      const uploadTime = img.uploadedAt.getTime();
      const ageMs = now.getTime() - uploadTime;
      return ageMs > safetyPeriodMs;
    });

    if (imagesToDelete.length === 0) {
      return {
        success: true,
        message: `找到 ${unusedImages.length} 個未使用的圖片，但都在安全期內（${safetyPeriodDays} 天）`,
        deleted: 0,
      };
    }

    // 刪除圖片
    const fileNames = imagesToDelete.map(img => img.fileName);
    const result = await deleteImages(
      fileNames,
      'auto',
      `自動清理：圖片上傳超過 ${safetyPeriodDays} 天且未被使用`
    );

    return {
      success: result.failed === 0,
      message: `成功刪除 ${result.success} 個圖片，失敗 ${result.failed} 個`,
      deleted: result.success,
      failed: result.failed,
      errors: result.errors,
    };
  } catch (error) {
    console.error('[Cron] Error cleaning up unused images:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '清理失敗',
      deleted: 0,
    };
  }
}

/**
 * 手動執行清理任務（用於測試）
 * 使用方法：npx tsx server/cron/cleanupUnusedImages.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupUnusedImagesTask()
    .then(result => {
      console.log(result);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => console.error(err));
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}