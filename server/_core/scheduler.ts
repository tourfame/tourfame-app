/**
 * Cron job scheduler
 * Schedules recurring tasks using node-cron
 */

import cron from "node-cron";
import { runRemoveDuplicates } from "../cron/removeDuplicates";

/**
 * Schedule daily removal of duplicate tours at 00:00 (midnight)
 * Cron expression: "0 0 * * *" means:
 * - Minute: 0
 * - Hour: 0 (midnight)
 * - Day of month: * (every day)
 * - Month: * (every month)
 * - Day of week: * (every day of the week)
 */
export function scheduleRemoveDuplicates() {
  // Run every day at 00:00 (midnight)
  cron.schedule("0 0 * * *", async () => {
    await runRemoveDuplicates();
  }, {
    timezone: "Asia/Hong_Kong" // Use Hong Kong timezone
  });

}

/**
 * Schedule weekly cleanup of unused images
 * Runs every Sunday at 02:00 AM
 * Cron expression: "0 2 * * 0" means:
 * - Minute: 0
 * - Hour: 2 (2 AM)
 * - Day of month: * (every day)
 * - Month: * (every month)
 * - Day of week: 0 (Sunday)
 */
export async function scheduleCleanupUnusedImages() {
  const { cleanupUnusedImagesTask } = await import("../cron/cleanupUnusedImages");
  
  // Run every Sunday at 02:00 AM
  cron.schedule("0 2 * * 0", async () => {
    const result = await cleanupUnusedImagesTask();
    if (result.errors && result.errors.length > 0) {
      console.error('[Scheduler] Image cleanup errors:', result.errors);
    }
  }, {
    timezone: "Asia/Hong_Kong" // Use Hong Kong timezone
  });

}
