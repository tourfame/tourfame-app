import { describe, it, expect, beforeAll } from 'vitest';
import { createUser, getUserByEmail, searchTours } from './db';

describe('Platform Functionality Tests', () => {
  const testUser = {
    email: 'test@tourfame.com',
    password: 'Test123456',
    name: '測試用戶',
  };

  describe('User Registration', () => {
    it('should register a new test user', async () => {
      try {
        const result = await createUser(testUser);
        expect(result).toBeDefined();
        console.log('✅ 用戶註冊成功');
      } catch (error: any) {
        // User might already exist
        if (error.message?.includes('Duplicate')) {
          console.log('ℹ️ 測試用戶已存在');
        } else {
          throw error;
        }
      }
    });

    it('should retrieve the registered user', async () => {
      const user = await getUserByEmail(testUser.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);
      console.log('✅ 用戶查詢成功');
    });
  });

  describe('Search Functionality', () => {
    it('should search tours by destination (日本)', async () => {
      const result = await searchTours({ keyword: '日本', limit: 10 });
      expect(result).toBeDefined();
      expect(result.tours).toBeInstanceOf(Array);
      console.log(`✅ 目的地搜尋成功：找到 ${result.total} 個日本旅行團`);
      
      // Verify results contain destination keyword
      if (result.tours.length > 0) {
        const hasMatch = result.tours.some(tour => 
          tour.destination?.includes('日本') || 
          tour.title?.includes('日本')
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('should search tours by agency name (東瀛遊)', async () => {
      const result = await searchTours({ keyword: '東瀛遊', limit: 10 });
      expect(result).toBeDefined();
      expect(result.tours).toBeInstanceOf(Array);
      console.log(`✅ 旅行社名稱搜尋成功：找到 ${result.total} 個東瀛遊旅行團`);
      
      // Verify results contain agency name
      if (result.tours.length > 0) {
        const hasMatch = result.tours.some(tour => 
          tour.agencyName?.includes('東瀛遊')
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('should search tours by destination (韓國)', async () => {
      const result = await searchTours({ keyword: '韓國', limit: 10 });
      expect(result).toBeDefined();
      console.log(`✅ 目的地搜尋成功：找到 ${result.total} 個韓國旅行團`);
    });

    it('should search tours by destination (台灣)', async () => {
      const result = await searchTours({ keyword: '台灣', limit: 10 });
      expect(result).toBeDefined();
      console.log(`✅ 目的地搜尋成功：找到 ${result.total} 個台灣旅行團`);
    });
  });
});
