/**
 * Daily cron job to remove duplicate tours
 * Runs every day at 00:00 (midnight)
 * 
 * Duplicate criteria:
 * - Same destination
 * - Same title
 * - Same agency name
 * 
 * Keeps the most recent tour (by createdAt)
 */

import { removeDuplicateTours } from "../db";

export async function runRemoveDuplicates() {
  try {
    const deletedCount = await removeDuplicateTours();
    return { success: true, deletedCount };
  } catch (error) {
    console.error("[Cron] Error removing duplicates:", error);
    return { success: false, error };
  }
}

// Run immediately if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRemoveDuplicates()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
