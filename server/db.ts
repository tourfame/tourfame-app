import { eq, desc, asc, and, gte, lte, like, or, inArray, sql, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { users, tours, agencies, scrapeJobs, tourRatings, tourComments, reviews, reviewReplies, favorites, viewHistory, advertisements, adTracking, notifications } from "../drizzle/schema";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to extract connection parameters
      const dbUrl = new URL(process.env.DATABASE_URL);
      
      // Create mysql2 connection pool with SSL configuration
      const poolConnection = mysql.createPool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 3306,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1), // Remove leading '/'
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      
      _db = drizzle(poolConnection, { schema, mode: 'default' });
      console.log("[Database] Connected successfully with SSL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Authentication ====================

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await db.insert(users).values({
    email: data.email,
    password: hashedPassword,
    name: data.name || null,
    role: data.role || "user",
  });

  return result;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

export async function getUserByName(name: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.name, name))
    .limit(1);

  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] || null;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export async function setPasswordResetToken(
  userId: number,
  resetToken: string,
  expiryDate: Date
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({
      resetToken: resetToken,
      resetTokenExpiry: expiryDate,
    })
    .where(eq(users.id, userId));
}

export async function getUserByResetToken(resetToken: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, resetToken))
    .limit(1);

  return result[0] || null;
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) return;

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await db
    .update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, userId));
}

// ==================== Tour Queries ====================

export async function getFeaturedTours(limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  // Get all active tours with comment count
  const allTours = await db
    .select({
      id: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      originalPrice: tours.originalPrice,
      departureDate: tours.departureDate,
      availableSeats: tours.availableSeats,
      tourType: tours.tourType,
      isNoShopping: tours.isNoShopping,
      isVerified: tours.isVerified,
      rating: tours.rating,
      reviewCount: tours.reviewCount,
      affiliateLink: tours.affiliateLink,
      status: tours.status,
      agencyId: tours.agencyId,
      agencyName: agencies.name,
      agencyLogoUrl: sql<string | null>`${agencies}.logoUrl`,
      agencyWhatsapp: sql<string | null>`${agencies}.whatsapp`,
      agencyPhone: sql<string | null>`${agencies}.phone`,
      imageUrl: sql<string | null>`${tours}.imageUrl`,
      sourceUrl: sql<string | null>`${tours}.sourceUrl`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM tour_comments WHERE tour_comments.tourId = ${tours}.id)`,
    })
    .from(tours)
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(and(eq(tours.status, "active"), eq(tours.isPublished, true)));

  // If there are fewer tours than requested, return all
  if (allTours.length <= limit) {
    const result = allTours;
    // Ensure null values are properly handled
    return result.map(tour => ({
      ...tour,
      imageUrl: tour.imageUrl || null,
      sourceUrl: tour.sourceUrl || null,
      agencyLogoUrl: tour.agencyLogoUrl || null,
      agencyWhatsapp: tour.agencyWhatsapp || null,
      agencyPhone: tour.agencyPhone || null,
      commentCount: tour.commentCount || 0,
    }));
  }

  // Use current date as seed for consistent daily randomization
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Seeded random number generator
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Shuffle array using seeded random
  const shuffled = [...allTours];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Take first 'limit' items
  const result = shuffled.slice(0, limit);

  // Ensure null values are properly handled
  return result.map(tour => ({
    ...tour,
    imageUrl: tour.imageUrl || null,
    sourceUrl: tour.sourceUrl || null,
    agencyLogoUrl: tour.agencyLogoUrl || null,
    agencyWhatsapp: tour.agencyWhatsapp || null,
    agencyPhone: tour.agencyPhone || null,
    commentCount: tour.commentCount || 0,
  }));
}

export async function getNoShoppingTours(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tours)
    .where(and(eq(tours.isNoShopping, true), eq(tours.status, "active"), eq(tours.isPublished, true)))
    .orderBy(desc(tours.rating))
    .limit(limit);
}

// New simplified search function
export async function searchTours(params: {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  agencyId?: number;
  sortBy?: string;
  limit?: number;
}): Promise<{
  tours: Array<{
    id: number;
    title: string;
    destination: string;
    days: number;
    nights: number;
    price: string;
    departureDate: Date;
    rating: string | null;
    reviewCount: number;
    imageUrl: string | null;
    sourceUrl: string | null;
    agencyId: number;
    agencyName: string | null;
    agencyWhatsapp: string | null;
    agencyPhone: string | null;
  }>;
  total: number;
}> {
  const db = await getDb();
  if (!db) return { tours: [], total: 0 };

  // Build WHERE conditions
  const conditions: any[] = [
    eq(tours.status, "active"),
    eq(tours.isPublished, true),
  ];

  // Keyword search across multiple fields
  if (params.keyword && params.keyword.trim()) {
    const keyword = params.keyword.trim();
    conditions.push(
      or(
        like(tours.title, `%${keyword}%`),
        like(tours.destination, `%${keyword}%`),
        like(agencies.name, `%${keyword}%`)
      )
    );
  }

  // Price range filter
  if (params.minPrice !== undefined && params.minPrice > 0) {
    conditions.push(gte(sql`CAST(${tours.price} AS DECIMAL)`, params.minPrice));
  }
  if (params.maxPrice !== undefined && params.maxPrice > 0) {
    conditions.push(lte(sql`CAST(${tours.price} AS DECIMAL)`, params.maxPrice));
  }

  // Days range filter
  if (params.minDays !== undefined && params.minDays > 0) {
    conditions.push(gte(tours.days, params.minDays));
  }
  if (params.maxDays !== undefined && params.maxDays > 0) {
    conditions.push(lte(tours.days, params.maxDays));
  }

  // Agency filter
  if (params.agencyId) {
    conditions.push(eq(tours.agencyId, params.agencyId));
  }

  // Determine sort order
  let orderByClause: any = desc(tours.rating); // Default: highest rating first
  if (params.sortBy === "price_asc") {
    orderByClause = asc(tours.price);
  } else if (params.sortBy === "price_desc") {
    orderByClause = desc(tours.price);
  } else if (params.sortBy === "rating_desc") {
    orderByClause = desc(tours.rating);
  } else if (params.sortBy === "most_liked") {
    // 按評價的讚好數排序（需要從評價表統計）
    orderByClause = desc(tours.reviewCount);
  }

  // Execute query with count
  const whereClause = and(...conditions);
  
  const [result, countResult] = await Promise.all([
    db
      .select({
        id: tours.id,
        title: tours.title,
        destination: tours.destination,
        days: tours.days,
        nights: tours.nights,
        price: tours.price,
        departureDate: tours.departureDate,
        rating: tours.rating,
        reviewCount: tours.reviewCount,
        imageUrl: tours.imageUrl,
        sourceUrl: tours.sourceUrl,
        agencyId: tours.agencyId,
        agencyName: agencies.name,
        agencyWhatsapp: agencies.whatsapp,
        agencyPhone: agencies.phone,
      })
      .from(tours)
      .leftJoin(agencies, eq(tours.agencyId, agencies.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(params.limit || 100),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tours)
      .leftJoin(agencies, eq(tours.agencyId, agencies.id))
      .where(whereClause),
  ]);

  return {
    tours: result,
    total: Number(countResult[0]?.count || 0),
  };
}

export async function getTourById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      originalPrice: tours.originalPrice,
      departureDate: tours.departureDate,
      availableSeats: tours.availableSeats,
      minGroupSize: tours.minGroupSize,
      tourType: tours.tourType,
      isNoShopping: tours.isNoShopping,
      isVerified: tours.isVerified,
      rating: tours.rating,
      reviewCount: tours.reviewCount,
      affiliateLink: tours.affiliateLink,
      status: tours.status,
      agencyId: tours.agencyId,
      highlights: tours.highlights,
      itinerary: tours.itinerary,
      inclusions: tours.inclusions,
      exclusions: tours.exclusions,
      hotels: tours.hotels,
      meals: tours.meals,
      imageUrl: tours.imageUrl,
      sourceUrl: tours.sourceUrl,
      viewCount: tours.viewCount,
      createdAt: tours.createdAt,
      updatedAt: tours.updatedAt,
      agencyName: agencies.name,
      agencyLogoUrl: sql<string | null>`${agencies}.logoUrl`,
      agencyWhatsapp: sql<string | null>`${agencies}.whatsapp`,
      agencyPhone: sql<string | null>`${agencies}.phone`,
    })
    .from(tours)
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(eq(tours.id, id))
    .limit(1);

  return result[0] || null;
}

export async function incrementTourViewCount(tourId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(tours)
    .set({ viewCount: sql`${tours.viewCount} + 1` })
    .where(eq(tours.id, tourId));
}

// ==================== Agency Queries ====================

export async function getAllAgencies() {
  const db = await getDb();
  if (!db) return [];

  // 按 sortOrder 降序排列（高的在前），然後按 id 降序（新的在前）
  return await db.select().from(agencies).orderBy(desc(agencies.sortOrder), desc(agencies.id));
}

export async function getAgencyById(agencyId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(agencies).where(eq(agencies.id, agencyId)).limit(1);
  return result[0] || null;
}

export async function updateAgencyLogo(agencyId: number, logoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Note: logoUrl field added to schema but needs full migration
  // Temporarily using raw SQL to update
  await db.execute(sql`UPDATE agencies SET logoUrl = ${logoUrl} WHERE id = ${agencyId}`);
}

export async function updateAgency(agencyId: number, data: { whatsapp?: string; phone?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Filter out undefined values to prevent empty SET clause
  const updateData: Record<string, any> = {};
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  // Only update if there's something to update
  if (Object.keys(updateData).length === 0) {
    return; // Nothing to update
  }

  await db.update(agencies).set(updateData).where(eq(agencies.id, agencyId));
}

export async function swapAgencySortOrder(agencyId1: number, agencyId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");


  // 獲取兩個旅行社的當前 sortOrder
  const agency1 = await db.select().from(agencies).where(eq(agencies.id, agencyId1)).limit(1);
  const agency2 = await db.select().from(agencies).where(eq(agencies.id, agencyId2)).limit(1);

  if (agency1.length === 0 || agency2.length === 0) {
    console.error(`[SwapSort] Agency not found: agency1=${agency1.length}, agency2=${agency2.length}`);
    throw new Error("旅行社不存在");
  }

  const sortOrder1 = (agency1[0] as any).sortOrder ?? 0;
  const sortOrder2 = (agency2[0] as any).sortOrder ?? 0;


  // 如果兩個 sortOrder 相同，需要先設置不同的值
  if (sortOrder1 === sortOrder2) {
    // 將第一個設置為當前值+1，第二個保持不變
    await db.update(agencies).set({ sortOrder: sortOrder1 + 1 }).where(eq(agencies.id, agencyId1));
  } else {
    // 交換 sortOrder
    await db.update(agencies).set({ sortOrder: sortOrder2 }).where(eq(agencies.id, agencyId1));
    await db.update(agencies).set({ sortOrder: sortOrder1 }).where(eq(agencies.id, agencyId2));
  }
}

export async function createAgency(data: { name: string; whatsapp?: string; phone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if agency with same name already exists
  const existing = await db.select().from(agencies).where(eq(agencies.name, data.name)).limit(1);
  if (existing.length > 0) {
    throw new Error(`旅行社「${data.name}」已存在`);
  }

  await db.insert(agencies).values({
    name: data.name,
    whatsapp: data.whatsapp || null,
    phone: data.phone || null,
  });

  // Get the newly created agency
  const [newAgency] = await db.select().from(agencies).where(eq(agencies.name, data.name)).limit(1);
  return newAgency;
}

export async function deleteAgency(agencyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if agency has associated tours
  const toursCount = await db.select({ count: sql<number>`count(*)` })
    .from(tours)
    .where(eq(tours.agencyId, agencyId));
  
  if (toursCount[0]?.count > 0) {
    throw new Error(`無法刪除：該旅行社還有 ${toursCount[0].count} 個相關的旅行團。請先刪除所有相關旅行團。`);
  }

  // Check if agency has associated scrape jobs
  const jobsCount = await db.select({ count: sql<number>`count(*)` })
    .from(scrapeJobs)
    .where(eq(scrapeJobs.agencyId, agencyId));
  
  if (jobsCount[0]?.count > 0) {
    throw new Error(`無法刪除：該旅行社還有 ${jobsCount[0].count} 個相關的爬蟲任務。請先刪除所有相關任務。`);
  }

  await db.delete(agencies).where(eq(agencies.id, agencyId));
}

// ==================== Scrape Job Queries ====================

export async function createScrapeJob(data: {
  name: string;
  url: string;
  price?: number;
  agencyId: number;
  category?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const nextExecutionAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const result = await db.insert(scrapeJobs).values({
    name: data.name,
    url: data.url,
    price: data.price ? data.price.toString() : null,
    agencyId: data.agencyId,
    category: data.category as any,
    createdBy: data.createdBy,
    status: "pending",
    scheduleEnabled: 1,
    nextExecutionAt,
  });

  return result;
}

export async function getScrapeJobById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(scrapeJobs)
    .where(eq(scrapeJobs.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getAllScrapeJobs(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.createdAt))
    .limit(limit);
}

export async function updateScrapeJob(
  id: number,
  data: {
    status?: "pending" | "processing" | "completed" | "failed";
    toursFound?: number;
    toursImported?: number;
    errorMessage?: string;
    rawData?: string;
    sourceUrl?: string | null;
    pdfUrl?: string | null;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scrapeJobs).set(data).where(eq(scrapeJobs.id, id));
}

export async function updateScrapeJobInfo(
  id: number,
  data: {
    name?: string;
    url?: string;
    price?: number;
    agencyId?: number;
    category?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert price to string if provided
  const updateData = {
    ...data,
    price: data.price !== undefined ? data.price.toString() : undefined,
  };

  await db.update(scrapeJobs).set(updateData as any).where(eq(scrapeJobs.id, id));
}

export async function deleteScrapeJob(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete the scrape job - cascade delete will automatically remove related tours
  await db.delete(scrapeJobs).where(eq(scrapeJobs.id, id));
}

// ==================== Bulk Tour Insert ====================

export async function bulkInsertTours(toursData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (toursData.length === 0) return;

  // Upsert logic: check if tour exists by title + agencyId, update if exists, insert if not
  for (const tourData of toursData) {
    const existing = await db
      .select()
      .from(tours)
      .where(
        and(
          eq(tours.title, tourData.title),
          eq(tours.agencyId, tourData.agencyId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing tour
      await db
        .update(tours)
        .set({
          ...tourData,
          updatedAt: new Date(),
        })
        .where(eq(tours.id, existing[0].id));
    } else {
      // Insert new tour
      await db.insert(tours).values(tourData);
    }
  }
}



// ==================== Tour Management ====================

export async function getAllTours(params?: {
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 50, offset = 0 } = params || {};

  const result = await db
    .select({
      id: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      originalPrice: tours.originalPrice,
      departureDate: tours.departureDate,
      tourType: tours.tourType,
      imageUrl: tours.imageUrl,
      sourceUrl: tours.sourceUrl,
      createdAt: tours.createdAt,
      agencyId: tours.agencyId,
      agencyName: agencies.name,
      isPublished: tours.isPublished,
    })
    .from(tours)
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .orderBy(desc(tours.createdAt))
    .limit(limit)
    .offset(offset);

  return result.map(row => ({
    ...row,
    price: row.price ? parseFloat(row.price.toString()) : 0,
    originalPrice: row.originalPrice ? parseFloat(row.originalPrice.toString()) : null,
    imageUrl: row.imageUrl || null,
    sourceUrl: row.sourceUrl || null,
    pdfUrl: row.sourceUrl || null, // 添加 pdfUrl 欄位，使用 sourceUrl 作為 PDF 鏈結
    agencyName: row.agencyName || null,
  }));
}

export async function updateTour(tourId: number, data: {
  title?: string;
  destination?: string;
  days?: number;
  nights?: number;
  price?: number;
  originalPrice?: number;
  departureDate?: string;
  tourType?: "pure_play" | "luxury" | "cruise" | "budget" | "family";
  imageUrl?: string;
  sourceUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert price to string for database
  const updateData: any = { ...data };
  if (data.price !== undefined) {
    updateData.price = data.price.toString();
  }
  if (data.originalPrice !== undefined) {
    updateData.originalPrice = data.originalPrice.toString();
  }

  await db.update(tours).set(updateData).where(eq(tours.id, tourId));
}

export async function deleteTour(tourId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tours).where(eq(tours.id, tourId));
}

export async function toggleTourPublish(tourId: number, isPublished: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tours).set({ isPublished }).where(eq(tours.id, tourId));
}

// ==================== Tour Ratings & Comments ====================

export async function createRating(data: {
  tourId: number;
  userId: number;
  rating: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already rated this tour
  const existing = await db
    .select()
    .from(tourRatings)
    .where(and(eq(tourRatings.tourId, data.tourId), eq(tourRatings.userId, data.userId)))
    .limit(1);

  let ratingId: number;
  
  if (existing.length > 0) {
    // Update existing rating
    await db
      .update(tourRatings)
      .set({ rating: data.rating })
      .where(eq(tourRatings.id, existing[0].id));
    ratingId = existing[0].id;
  } else {
    // Create new rating
    const result = await db.insert(tourRatings).values(data);
    ratingId = result[0].insertId;
  }
  
  // Update tour's average rating and review count
  const allRatings = await db
    .select({ rating: tourRatings.rating })
    .from(tourRatings)
    .where(eq(tourRatings.tourId, data.tourId));
  
  const avgRating = allRatings.length > 0 
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
    : 0;
  
  await db
    .update(tours)
    .set({ 
      rating: avgRating.toFixed(2),
      reviewCount: allRatings.length 
    })
    .where(eq(tours.id, data.tourId));
  
  return ratingId;
}

export async function getTourRatings(tourId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: tourRatings.id,
      rating: tourRatings.rating,
      createdAt: tourRatings.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(tourRatings)
    .leftJoin(users, eq(tourRatings.userId, users.id))
    .where(eq(tourRatings.tourId, tourId))
    .orderBy(desc(tourRatings.createdAt));

  return result;
}

export async function createComment(data: {
  tourId: number;
  userId: number;
  content: string;
  isAnonymous?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tourComments).values({
    tourId: data.tourId,
    userId: data.userId,
    content: data.content,
    isAnonymous: data.isAnonymous || false,
  });
  return result[0].insertId;
}

export async function getTourComments(tourId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: tourComments.id,
      content: tourComments.content,
      createdAt: tourComments.createdAt,
      userId: tourComments.userId,
      userName: users.name,
      userEmail: users.email,
      isAnonymous: tourComments.isAnonymous,
    })
    .from(tourComments)
    .leftJoin(users, eq(tourComments.userId, users.id))
    .where(eq(tourComments.tourId, tourId))
    .orderBy(desc(tourComments.createdAt));

  return result;
}

export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only allow user to delete their own comments
  await db
    .delete(tourComments)
    .where(and(eq(tourComments.id, commentId), eq(tourComments.userId, userId)));
}


// ==================== Reviews ====================

export async function createReview(data: {
  tourId: number;
  userId: number;
  rating: number;
  title?: string;
  content: string;
  photos?: string[];
  travelDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviews).values({
    tourId: data.tourId,
    userId: data.userId,
    rating: data.rating,
    title: data.title || null,
    content: data.content,
    photos: data.photos ? JSON.stringify(data.photos) : null,
    travelDate: data.travelDate || null,
  });

  return result[0].insertId;
}

export async function getTourReviews(tourId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: reviews.id,
      tourId: reviews.tourId,
      userId: reviews.userId,
      userName: users.name,
      userEmail: users.email,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      photos: reviews.photos,
      isVerified: reviews.isVerified,
      verificationMethod: reviews.verificationMethod,
      travelDate: reviews.travelDate,
      helpfulCount: reviews.helpfulCount,
      replyCount: reviews.replyCount,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.tourId, tourId))
    .orderBy(desc(reviews.createdAt));

  return result.map((r) => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : [],
  }));
}

export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: reviews.id,
      tourId: reviews.tourId,
      tourTitle: tours.title,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      photos: reviews.photos,
      isVerified: reviews.isVerified,
      travelDate: reviews.travelDate,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .leftJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));

  return result.map((r) => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : [],
  }));
}

export async function deleteReview(reviewId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only allow user to delete their own reviews
  await db
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
}

export async function markReviewHelpful(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(reviews)
    .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
    .where(eq(reviews.id, reviewId));
}

// ==================== Review Replies ====================

export async function createReviewReply(data: {
  reviewId: number;
  userId: number;
  content: string;
  isAuthorReply: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert reply
  const result = await db.insert(reviewReplies).values({
    reviewId: data.reviewId,
    userId: data.userId,
    content: data.content,
    isAuthorReply: data.isAuthorReply,
  });

  const replyId = Number((result as any).insertId);

  // Update reply count
  await db
    .update(reviews)
    .set({ replyCount: sql`${reviews.replyCount} + 1` })
    .where(eq(reviews.id, data.reviewId));

  return replyId;
}

export async function getReviewReplies(reviewId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: reviewReplies.id,
      reviewId: reviewReplies.reviewId,
      userId: reviewReplies.userId,
      userName: users.name,
      userEmail: users.email,
      content: reviewReplies.content,
      isAuthorReply: reviewReplies.isAuthorReply,
      createdAt: reviewReplies.createdAt,
    })
    .from(reviewReplies)
    .leftJoin(users, eq(reviewReplies.userId, users.id))
    .where(eq(reviewReplies.reviewId, reviewId))
    .orderBy(asc(reviewReplies.createdAt));

  return result;
}

export async function deleteReviewReply(replyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get reply to update count
  const reply = await db
    .select()
    .from(reviewReplies)
    .where(eq(reviewReplies.id, replyId))
    .limit(1);

  if (reply.length === 0) return;

  // Delete reply (only allow user to delete their own replies)
  await db
    .delete(reviewReplies)
    .where(and(eq(reviewReplies.id, replyId), eq(reviewReplies.userId, userId)));

  // Update reply count
  await db
    .update(reviews)
    .set({ replyCount: sql`${reviews.replyCount} - 1` })
    .where(eq(reviews.id, reply[0].reviewId));
}

// ==================== Favorites ====================

export async function addFavorite(userId: number, tourId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(favorites).values({ userId, tourId });
    return result[0].insertId;
  } catch (error: any) {
    // If duplicate entry (already favorited), ignore the error
    if (error.code === 'ER_DUP_ENTRY') {
      return null;
    }
    throw error;
  }
}

export async function removeFavorite(userId: number, tourId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.tourId, tourId)));
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: favorites.id,
      tourId: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      originalPrice: tours.originalPrice,
      departureDate: tours.departureDate,
      imageUrl: tours.imageUrl,
      rating: tours.rating,
      reviewCount: tours.reviewCount,
      isNoShopping: tours.isNoShopping,
      isVerified: tours.isVerified,
      agencyId: tours.agencyId,
      agencyName: agencies.name,
      agencyLogo: agencies.logo,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .leftJoin(tours, eq(favorites.tourId, tours.id))
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result;
}

export async function checkIsFavorited(userId: number, tourId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.tourId, tourId)))
    .limit(1);

  return result.length > 0;
}

// ==================== View History ====================

export async function recordViewHistory(userId: number | null, tourId: number, sessionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(viewHistory).values({
    userId: userId || undefined,
    tourId,
    sessionId,
  });

  return result[0].insertId;
}

export async function getUserViewHistory(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: viewHistory.id,
      tourId: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      departureDate: tours.departureDate,
      imageUrl: tours.imageUrl,
      rating: tours.rating,
      reviewCount: tours.reviewCount,
      agencyName: agencies.name,
      viewedAt: viewHistory.viewedAt,
    })
    .from(viewHistory)
    .leftJoin(tours, eq(viewHistory.tourId, tours.id))
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(eq(viewHistory.userId, userId))
    .orderBy(desc(viewHistory.viewedAt))
    .limit(limit);

  return result;
}

// ============ User Management ============
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserInfo(userId: number, data: { name?: string; email?: string; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function deleteUserById(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

export async function bulkDeleteUsers(userIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userIds.length === 0) return;
  
  console.log(`[bulkDeleteUsers] Deleting ${userIds.length} users`);
  
  // Process in batches of 20 to avoid SQL parameter limits (reduced from 50)
  const batchSize = 20;
  let deletedCount = 0;
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    try {
      console.log(`[bulkDeleteUsers] Processing batch ${Math.floor(i / batchSize) + 1}, IDs: ${batch.join(', ')}`);
      await db.delete(users).where(inArray(users.id, batch));
      deletedCount += batch.length;
      console.log(`[bulkDeleteUsers] Successfully deleted batch, total: ${deletedCount}/${userIds.length}`);
    } catch (error: any) {
      console.error(`[bulkDeleteUsers] Failed to delete batch:`, error);
      throw new Error(`Failed to delete users in batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    }
  }
  
  console.log(`[bulkDeleteUsers] Completed: deleted ${deletedCount} users`);
}

export async function updateUserStatus(userId: number, status: "active" | "suspended") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

// ==================== Recommendations ====================

export async function getRecommendations(userId: number, limit: number = 12) {
  const db = await getDb();
  if (!db) return [];

  // Step 1: Get user's favorites and view history
  const userFavorites = await db
    .select({ tourId: favorites.tourId })
    .from(favorites)
    .where(eq(favorites.userId, userId));

  const userViewHistory = await db
    .select({ tourId: viewHistory.tourId })
    .from(viewHistory)
    .where(eq(viewHistory.userId, userId))
    .orderBy(desc(viewHistory.viewedAt))
    .limit(20);

  // Combine favorites and view history to get user's interested tours
  const interestedTourIds = [
    ...userFavorites.map(f => f.tourId),
    ...userViewHistory.map(v => v.tourId),
  ];

  // If user has no history, return popular tours
  if (interestedTourIds.length === 0) {
    return await db
      .select({
        id: tours.id,
        title: tours.title,
        destination: tours.destination,
        days: tours.days,
        nights: tours.nights,
        price: tours.price,
        originalPrice: tours.originalPrice,
        departureDate: tours.departureDate,
        imageUrl: tours.imageUrl,
        rating: tours.rating,
        reviewCount: tours.reviewCount,
        isNoShopping: tours.isNoShopping,
        isVerified: tours.isVerified,
        agencyId: tours.agencyId,
        agencyName: agencies.name,
        agencyLogo: agencies.logo,
        sourceUrl: tours.sourceUrl,
      })
      .from(tours)
      .leftJoin(agencies, eq(tours.agencyId, agencies.id))
      .where(eq(tours.status, "active"))
      .orderBy(desc(tours.rating), desc(tours.reviewCount))
      .limit(limit);
  }

  // Step 2: Get details of interested tours to analyze preferences
  const interestedTours = await db
    .select({
      destination: tours.destination,
      agencyId: tours.agencyId,
      tourType: tours.tourType,
    })
    .from(tours)
    .where(inArray(tours.id, interestedTourIds));

  // Step 3: Analyze user preferences
  const destinationCount: Record<string, number> = {};
  const agencyCount: Record<number, number> = {};
  const tourTypeCount: Record<string, number> = {};

  interestedTours.forEach(tour => {
    if (tour.destination) {
      destinationCount[tour.destination] = (destinationCount[tour.destination] || 0) + 1;
    }
    if (tour.agencyId) {
      agencyCount[tour.agencyId] = (agencyCount[tour.agencyId] || 0) + 1;
    }
    if (tour.tourType) {
      tourTypeCount[tour.tourType] = (tourTypeCount[tour.tourType] || 0) + 1;
    }
  });

  // Get top preferences
  const topDestinations = Object.entries(destinationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dest]) => dest);

  const topAgencies = Object.entries(agencyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => parseInt(id));

  const topTourTypes = Object.entries(tourTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  // Step 4: Find similar tours based on preferences
  // Build WHERE conditions
  let whereConditions = [eq(tours.status, "active")];

  // Exclude already viewed/favorited tours
  if (interestedTourIds.length > 0) {
    whereConditions.push(not(inArray(tours.id, interestedTourIds)));
  }

  // Match destination OR agency OR tour type
  const matchConditions = [];
  if (topDestinations.length > 0) {
    matchConditions.push(inArray(tours.destination, topDestinations));
  }
  if (topAgencies.length > 0) {
    matchConditions.push(inArray(tours.agencyId, topAgencies));
  }
  if (topTourTypes.length > 0) {
    matchConditions.push(inArray(tours.tourType, topTourTypes as any));
  }

  if (matchConditions.length > 0) {
    whereConditions.push(or(...matchConditions) as any);
  }

  const recommendations = await db
    .select({
      id: tours.id,
      title: tours.title,
      destination: tours.destination,
      days: tours.days,
      nights: tours.nights,
      price: tours.price,
      originalPrice: tours.originalPrice,
      departureDate: tours.departureDate,
      imageUrl: tours.imageUrl,
      rating: tours.rating,
      reviewCount: tours.reviewCount,
      isNoShopping: tours.isNoShopping,
      isVerified: tours.isVerified,
      agencyId: tours.agencyId,
      agencyName: agencies.name,
      agencyLogo: agencies.logo,
      sourceUrl: tours.sourceUrl,
      tourType: tours.tourType,
    })
    .from(tours)
    .leftJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(and(...whereConditions))
    .orderBy(desc(tours.rating), desc(tours.createdAt))
    .limit(limit);

  return recommendations;
}

// ==================== Remove Duplicate Tours ====================

/**
 * Remove duplicate tours based on title and agency name
 * Keep the most recent tour (by createdAt) for each duplicate group
 * @returns Number of tours deleted
 */
export async function removeDuplicateTours(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Step 1: Find all tours with their agency names
    const allTours = await db
      .select({
        id: tours.id,
        title: tours.title,
        destination: tours.destination,
        agencyId: tours.agencyId,
        agencyName: agencies.name,
        createdAt: tours.createdAt,
      })
      .from(tours)
      .leftJoin(agencies, eq(tours.agencyId, agencies.id))
      .where(eq(tours.status, "active"));

    // Step 2: Group tours by title + agencyName
    const duplicateGroups: Map<string, typeof allTours> = new Map();

    allTours.forEach(tour => {
      // Create a unique key based on title and agency name
      const key = `${tour.title}|${tour.agencyName}`.toLowerCase();
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(tour);
    });

    // Step 3: Find duplicate groups (more than 1 tour with same key)
    const toursToDelete: number[] = [];

    duplicateGroups.forEach((group) => {
      if (group.length > 1) {
        // Sort by createdAt descending (newest first)
        group.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        // Keep the first (newest) tour, delete the rest
        for (let i = 1; i < group.length; i++) {
          toursToDelete.push(group[i].id);
        }
      }
    });

    // Step 4: Delete duplicate tours
    if (toursToDelete.length > 0) {
      // Delete in batches of 50 to avoid SQL parameter limit
      const batchSize = 50;
      for (let i = 0; i < toursToDelete.length; i += batchSize) {
        const batch = toursToDelete.slice(i, i + batchSize);
        await db.delete(tours).where(inArray(tours.id, batch));
      }
    }

    return toursToDelete.length;
  } catch (error) {
    console.error("[removeDuplicateTours] Error:", error);
    throw error;
  }
}

// ==================== Tour Image Categories ====================

export async function getAllImageCategories() {
  const db = await getDb();
  if (!db) return [];

  const { tourImageCategories } = await import("../drizzle/schema");
  const result = await db.select().from(tourImageCategories).orderBy(tourImageCategories.sortOrder);
  return result;
}

export async function updateImageCategoryKeywords(id: number, keywords: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tourImageCategories } = await import("../drizzle/schema");
  await db.update(tourImageCategories)
    .set({ keywords, updatedAt: new Date() })
    .where(eq(tourImageCategories.id, id));
}

export async function updateImageCategoryImage(id: number, imageUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tourImageCategories } = await import("../drizzle/schema");
  await db.update(tourImageCategories)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(tourImageCategories.id, id));
}

export async function createImageCategory(data: {
  name: string;
  keywords: string;
  imageUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tourImageCategories } = await import("../drizzle/schema");
  
  // Get the highest sort order
  const maxSortOrder = await db
    .select({ max: sql<number>`MAX(${tourImageCategories.sortOrder})` })
    .from(tourImageCategories);
  
  const nextSortOrder = (maxSortOrder[0]?.max || 0) + 1;

  await db
    .insert(tourImageCategories)
    .values({
      name: data.name,
      keywords: data.keywords,
      imageUrl: data.imageUrl,
      sortOrder: nextSortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
  // MySQL doesn't support .returning(), so we query the newly inserted record
  const [newCategory] = await db
    .select()
    .from(tourImageCategories)
    .where(eq(tourImageCategories.name, data.name))
    .orderBy(desc(tourImageCategories.id))
    .limit(1);
  
  return newCategory;
}

export async function deleteImageCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tourImageCategories } = await import("../drizzle/schema");
  
  await db.delete(tourImageCategories).where(eq(tourImageCategories.id, id));
}

// ==================== Advertisement Management ====================

/**
 * 創建廣告（將旅行團或旅行社設為推薦）
 */
export async function createAdvertisement(data: {
  type: "tour" | "agency";
  tourId?: number;
  agencyId?: number;
  placement: "home_top" | "recommendations_top" | "favorites_top" | "search_top" | "notifications_top";
  startDate: Date;
  endDate: Date;
  priority?: number;
  imageUrl?: string;
  linkUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(advertisements).values({
    type: data.type,
    tourId: data.tourId || null,
    agencyId: data.agencyId || null,
    placement: data.placement,
    startDate: data.startDate,
    endDate: data.endDate,
    priority: data.priority || 0,
    imageUrl: data.imageUrl || null,
    linkUrl: data.linkUrl || null,
    status: "active",
  });

  return result;
}

/**
 * 獲取活躍的廣告（按位置和優先級）
 */
export async function getActiveAdvertisements(placement: "home_top" | "recommendations_top" | "favorites_top" | "search_top" | "notifications_top", limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  const results = await db
    .select()
    .from(advertisements)
    .where(
      and(
        eq(advertisements.placement, placement),
        eq(advertisements.status, "active"),
        lte(advertisements.startDate, now),
        gte(advertisements.endDate, now)
      )
    )
    .orderBy(desc(advertisements.priority), desc(advertisements.createdAt))
    .limit(limit);

  return results;
}

/**
 * 獲取推薦的旅行團（用於搜尋結果頂部）
 */
export async function getFeaturedTourAds(limit: number = 3) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  const results = await db
    .select({
      ad: advertisements,
      tour: tours,
      agency: agencies,
    })
    .from(advertisements)
    .innerJoin(tours, eq(advertisements.tourId, tours.id))
    .innerJoin(agencies, eq(tours.agencyId, agencies.id))
    .where(
      and(
        eq(advertisements.type, "tour"),
        eq(advertisements.placement, "search_top"),
        eq(advertisements.status, "active"),
        lte(advertisements.startDate, now),
        gte(advertisements.endDate, now),
        eq(tours.isPublished, true)
      )
    )
    .orderBy(desc(advertisements.priority), desc(advertisements.createdAt))
    .limit(limit);

  return results;
}

/**
 * 獲取精選旅行社（用於首頁）
 */
export async function getFeaturedAgencyAds(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  const results = await db
    .select({
      ad: advertisements,
      agency: agencies,
    })
    .from(advertisements)
    .innerJoin(agencies, eq(advertisements.agencyId, agencies.id))
    .where(
      and(
        eq(advertisements.type, "agency"),
        eq(advertisements.placement, "home_top"),
        eq(advertisements.status, "active"),
        lte(advertisements.startDate, now),
        gte(advertisements.endDate, now)
      )
    )
    .orderBy(desc(advertisements.priority), desc(advertisements.createdAt))
    .limit(limit);

  return results;
}

/**
 * 暫停/啟用廣告
 */
export async function toggleAdStatus(adId: number, status: "active" | "paused") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(advertisements)
    .set({ status, updatedAt: new Date() })
    .where(eq(advertisements.id, adId));
}

/**
 * 刪除廣告
 */
export async function deleteAdvertisement(adId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(advertisements).where(eq(advertisements.id, adId));
}

/**
 * 記錄廣告點擊
 */
export async function trackAdClick(data: {
  advertisementId: number;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adTracking).values({
    advertisementId: data.advertisementId,
    eventType: "click",
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    referrer: data.referrer || null,
  });
}

/**
 * 記錄廣告曝光
 */
export async function trackAdImpression(data: {
  advertisementId: number;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adTracking).values({
    advertisementId: data.advertisementId,
    eventType: "impression",
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    referrer: null,
  });
}

/**
 * 獲取廣告統計數據
 */
export async function getAdStatistics(adId: number) {
  const db = await getDb();
  if (!db) return { impressions: 0, clicks: 0, ctr: 0 };

  const stats = await db
    .select({
      eventType: adTracking.eventType,
      count: sql<number>`COUNT(*)`,
    })
    .from(adTracking)
    .where(eq(adTracking.advertisementId, adId))
    .groupBy(adTracking.eventType);

  const impressions = stats.find((s) => s.eventType === "impression")?.count || 0;
  const clicks = stats.find((s) => s.eventType === "click")?.count || 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return { impressions, clicks, ctr };
}

// ==================== Notifications ====================

export async function createNotification(data: {
  userId: number;
  type: "review_reply" | "review_question" | "contact";
  title: string;
  content: string;
  reviewId?: number;
  replyId?: number;
  fromUserId?: number;
  tourId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      reviewId: notifications.reviewId,
      replyId: notifications.replyId,
      fromUserId: notifications.fromUserId,
      fromUserName: users.name,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      replyContent: reviewReplies.content,
      tourId: reviews.tourId,
      tourTitle: tours.title,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .leftJoin(reviewReplies, eq(notifications.replyId, reviewReplies.id))
    .leftJoin(reviews, eq(notifications.reviewId, reviews.id))
    .leftJoin(tours, eq(reviews.tourId, tours.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return result;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result[0]?.count || 0;
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

// ==================== Get All Admin Users ====================
export async function getAllAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"));
}
