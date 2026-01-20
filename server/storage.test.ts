import { describe, it, expect, beforeAll } from "vitest";
import { storagePut, storageDelete } from "./storage";

describe("Storage Operations", () => {
  let testFileKey: string;
  let testFileUrl: string;

  beforeAll(async () => {
    // Upload a test file
    const testContent = "Test PDF content for deletion test";
    const timestamp = Date.now();
    testFileKey = `test-files/${timestamp}-test.pdf`;
    
    const result = await storagePut(testFileKey, testContent, "application/pdf");
    testFileUrl = result.url;
  });

  describe("storagePut", () => {
    it("should upload a file and return URL", async () => {
      const content = "Test file content";
      const key = `test-files/${Date.now()}-upload-test.txt`;
      
      const result = await storagePut(key, content, "text/plain");
      
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("url");
      expect(result.key).toBe(key);
      expect(result.url).toContain(key);
    });

    it("should handle Buffer data", async () => {
      const buffer = Buffer.from("Binary test data");
      const key = `test-files/${Date.now()}-buffer-test.bin`;
      
      const result = await storagePut(key, buffer, "application/octet-stream");
      
      expect(result.key).toBe(key);
      expect(result.url).toBeTruthy();
    });
  });

  describe("storageDelete", () => {
    it("should delete an existing file", async () => {
      const result = await storageDelete(testFileKey);
      
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("should handle deletion of non-existent file gracefully", async () => {
      const nonExistentKey = `test-files/non-existent-${Date.now()}.txt`;
      
      // Should not throw error even if file doesn't exist
      const result = await storageDelete(nonExistentKey);
      expect(result.success).toBe(true);
    });
  });
});
