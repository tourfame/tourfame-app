import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, unique, tinyint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * 用戶表 - 核心認證系統
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 旅行社表
 */
export const agencies = mysqlTable("agencies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  logo: text("logo"),
  logoUrl: text("logoUrl"),
  website: text("website"),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 320 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0).notNull(),
  affiliateUrl: text("affiliateUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 旅行團主表
 */
export const tours = mysqlTable("tours", {
  id: int("id").autoincrement().primaryKey(),
  agencyId: int("agencyId").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  scrapeJobId: int("scrapeJobId").references(() => scrapeJobs.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  days: int("days").notNull(),
  nights: int("nights").notNull(),
  tourType: mysqlEnum("tourType", ["pure_play", "luxury", "cruise", "budget", "family"]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("HKD").notNull(),
  departureDate: timestamp("departureDate").notNull(),
  returnDate: timestamp("returnDate").notNull(),
  availableSeats: int("availableSeats").default(0).notNull(),
  minGroupSize: int("minGroupSize").default(1).notNull(),
  itinerary: text("itinerary").notNull(),
  highlights: text("highlights"),
  inclusions: text("inclusions"),
  exclusions: text("exclusions"),
  optionalActivities: text("optionalActivities"),
  hotels: text("hotels"),
  meals: text("meals"),
  transportation: text("transportation"),
  tourGuideLanguage: varchar("tourGuideLanguage", { length: 100 }),
  isNoShopping: boolean("isNoShopping").default(false).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  bookingCount: int("bookingCount").default(0).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0).notNull(),
  affiliateLink: text("affiliateLink").notNull(),
  imageUrl: text("imageUrl"),
  sourceUrl: text("sourceUrl"),
  status: mysqlEnum("status", ["active", "sold_out", "cancelled", "draft"]).default("active").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agencyIdx: index("agency_idx").on(table.agencyId),
  destinationIdx: index("destination_idx").on(table.destination),
  departureDateIdx: index("departure_date_idx").on(table.departureDate),
  tourTypeIdx: index("tour_type_idx").on(table.tourType),
  priceIdx: index("price_idx").on(table.price),
}));

/**
 * 標籤表
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: mysqlEnum("category", ["feature", "quality", "service", "value"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 旅行團標籤關聯表
 */
export const tourTags = mysqlTable("tour_tags", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tourTagUnique: unique("tour_tag_unique").on(table.tourId, table.tagId),
  tourIdx: index("tour_idx").on(table.tourId),
  tagIdx: index("tag_idx").on(table.tagId),
}));

/**
 * 評價表
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  photos: text("photos"),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationMethod: varchar("verificationMethod", { length: 100 }),
  travelDate: timestamp("travelDate"),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tourIdx: index("tour_idx").on(table.tourId),
  userIdx: index("user_idx").on(table.userId),
}));

/**
 * 評價回覆表 - 支持作者回覆和非作者提問
 */
export const reviewReplies = mysqlTable("review_replies", {
  id: int("id").autoincrement().primaryKey(),
  reviewId: int("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAuthorReply: boolean("isAuthorReply").default(false).notNull(), // 是否為評價作者的回覆
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  reviewIdx: index("review_idx").on(table.reviewId),
  userIdx: index("user_idx").on(table.userId),
}));

/**
 * 價格監控表
 */
export const priceWatches = mysqlTable("price_watches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  targetPrice: decimal("targetPrice", { precision: 10, scale: 2 }),
  notifyOnAnyDrop: boolean("notifyOnAnyDrop").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tourIdx: index("tour_idx").on(table.tourId),
  userTourUnique: unique("user_tour_unique").on(table.userId, table.tourId),
}));

/**
 * 價格歷史表
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (table) => ({
  tourIdx: index("tour_idx").on(table.tourId),
  recordedAtIdx: index("recorded_at_idx").on(table.recordedAt),
}));

/**
 * 社區問題表
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: int("tourId").references(() => tours.id, { onDelete: "set null" }),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  answerCount: int("answerCount").default(0).notNull(),
  upvoteCount: int("upvoteCount").default(0).notNull(),
  hasAcceptedAnswer: boolean("hasAcceptedAnswer").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tourIdx: index("tour_idx").on(table.tourId),
}));

/**
 * 社區答案表
 */
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull().references(() => questions.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  upvoteCount: int("upvoteCount").default(0).notNull(),
  isAccepted: boolean("isAccepted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  questionIdx: index("question_idx").on(table.questionId),
  userIdx: index("user_idx").on(table.userId),
}));

/**
 * Affiliate點擊追蹤表
 */
export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("sessionId", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => ({
  tourIdx: index("tour_idx").on(table.tourId),
  userIdx: index("user_idx").on(table.userId),
  clickedAtIdx: index("clicked_at_idx").on(table.clickedAt),
}));

/**
 * Affiliate轉換追蹤表
 */
export const affiliateConversions = mysqlTable("affiliate_conversions", {
  id: int("id").autoincrement().primaryKey(),
  clickId: int("clickId").references(() => affiliateClicks.id, { onDelete: "set null" }),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  conversionType: mysqlEnum("conversionType", ["cpa", "cps"]).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }),
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  convertedAt: timestamp("convertedAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
}, (table) => ({
  tourIdx: index("tour_idx").on(table.tourId),
  userIdx: index("user_idx").on(table.userId),
  convertedAtIdx: index("converted_at_idx").on(table.convertedAt),
}));

/**
 * 用戶瀏覽歷史表
 */
export const viewHistory = mysqlTable("view_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  sessionId: varchar("sessionId", { length: 255 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  durationSeconds: int("durationSeconds"),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tourIdx: index("tour_idx").on(table.tourId),
  viewedAtIdx: index("viewed_at_idx").on(table.viewedAt),
}));

/**
 * 用戶收藏表
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tourIdx: index("tour_idx").on(table.tourId),
  uniqueUserTour: index("unique_user_tour").on(table.userId, table.tourId),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = typeof agencies.$inferInsert;
export type Tour = typeof tours.$inferSelect;
export type InsertTour = typeof tours.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type TourTag = typeof tourTags.$inferSelect;
export type InsertTourTag = typeof tourTags.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type ReviewReply = typeof reviewReplies.$inferSelect;
export type InsertReviewReply = typeof reviewReplies.$inferInsert;
export type PriceWatch = typeof priceWatches.$inferSelect;
export type InsertPriceWatch = typeof priceWatches.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = typeof affiliateClicks.$inferInsert;
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertAffiliateConversion = typeof affiliateConversions.$inferInsert;
export type ViewHistory = typeof viewHistory.$inferSelect;
export type InsertViewHistory = typeof viewHistory.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * 爬蟲任務表
 */
export const scrapeJobs = mysqlTable("scrape_jobs", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  price: decimal("price", { precision: 10, scale: 2 }),
  agencyId: int("agencyId").references(() => agencies.id, { onDelete: "set null" }),
  category: mysqlEnum("category", ["japan", "asia", "long_haul", "china_long_haul", "guangdong"]),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  toursFound: int("toursFound").default(0).notNull(),
  toursImported: int("toursImported").default(0).notNull(),
  errorMessage: text("errorMessage"),
  rawData: text("rawData"), // JSON string of scraped data
  sourceUrl: text("sourceUrl"), // Original PDF URL (for on-demand upload)
  pdfUrl: text("pdfUrl"), // S3 URL of uploaded PDF file (for preview)
  retryCount: int("retryCount").default(0).notNull(), // Number of retry attempts
  maxRetries: int("maxRetries").default(3).notNull(), // Maximum number of retries
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  scheduleEnabled: tinyint("scheduleEnabled").default(1).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  nextExecutionAt: timestamp("nextExecutionAt"),
});

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobs.$inferInsert;

/**
 * 旅行團評分表
 */
export const tourRatings = mysqlTable("tour_ratings", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(), // 1-5 stars
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TourRating = typeof tourRatings.$inferSelect;
export type InsertTourRating = typeof tourRatings.$inferInsert;

/**
 * 旅行團留言表
 */
export const tourComments = mysqlTable("tour_comments", {
  id: int("id").autoincrement().primaryKey(),
  tourId: int("tourId").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TourComment = typeof tourComments.$inferSelect;
export type InsertTourComment = typeof tourComments.$inferInsert;

/**
 * 旅行團圖片分類表 - 管理圖片和匹配關鍵字
 */
export const tourImageCategories = mysqlTable("tour_image_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // 分類名稱（如「日本」、「歐洲/澳洲/長線」）
  imageUrl: text("imageUrl").notNull(), // 圖片 URL（S3 或本地路徑）
  keywords: text("keywords").notNull(), // 匹配關鍵字，逗號分隔（如「日本,東京,大阪」）
  sortOrder: int("sortOrder").default(0).notNull(), // 排序順序
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TourImageCategory = typeof tourImageCategories.$inferSelect;
export type InsertTourImageCategory = typeof tourImageCategories.$inferInsert;

/**
 * 廣告設置表 - 管理付費推薦的旅行團和旅行社
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["tour", "agency"]).notNull(), // 廣告類型：旅行團或旅行社
  tourId: int("tourId").references(() => tours.id, { onDelete: "cascade" }), // 如果是旅行團廣告
  agencyId: int("agencyId").references(() => agencies.id, { onDelete: "cascade" }), // 如果是旅行社廣告
  placement: mysqlEnum("placement", ["home_top", "recommendations_top", "favorites_top", "search_top", "notifications_top"]).notNull(), // 廣告位置
  startDate: timestamp("startDate").notNull(), // 廣告開始日期
  endDate: timestamp("endDate").notNull(), // 廣告結束日期
  priority: int("priority").default(0).notNull(), // 優先級（數字越大越優先）
  budget: decimal("budget", { precision: 10, scale: 2 }), // 預算
  costPerClick: decimal("costPerClick", { precision: 10, scale: 2 }), // 每次點擊成本
  costPerImpression: decimal("costPerImpression", { precision: 10, scale: 2 }), // 每千次曝光成本
  imageUrl: text("imageUrl"), // 廣告圖片 URL
  linkUrl: text("linkUrl"), // 跳轉鏈結 URL
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tourIdx: index("tour_idx").on(table.tourId),
  agencyIdx: index("agency_idx").on(table.agencyId),
  placementIdx: index("placement_idx").on(table.placement),
  statusIdx: index("status_idx").on(table.status),
}));

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;

/**
 * 廣告追蹤表 - 記錄廣告的曝光和點擊
 */
export const adTracking = mysqlTable("ad_tracking", {
  id: int("id").autoincrement().primaryKey(),
  advertisementId: int("advertisementId").notNull().references(() => advertisements.id, { onDelete: "cascade" }),
  eventType: mysqlEnum("eventType", ["impression", "click"]).notNull(), // 事件類型：曝光或點擊
  userId: int("userId").references(() => users.id, { onDelete: "set null" }), // 用戶ID（如果已登入）
  sessionId: varchar("sessionId", { length: 255 }), // Session ID
  ipAddress: varchar("ipAddress", { length: 45 }), // IP地址
  userAgent: text("userAgent"), // User Agent
  referrer: text("referrer"), // 來源頁面
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  adIdx: index("ad_idx").on(table.advertisementId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AdTracking = typeof adTracking.$inferSelect;
export type InsertAdTracking = typeof adTracking.$inferInsert;

/**
 * 圖片清理日誌表 - 記錄圖片清理歷史
 */
export const imageCleanupLogs = mysqlTable("image_cleanup_logs", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(), // 文件名
  filePath: varchar("filePath", { length: 500 }).notNull(), // 文件路徑
  fileSize: int("fileSize"), // 文件大小（bytes）
  deletedAt: timestamp("deletedAt").defaultNow().notNull(), // 刪除時間
  deletedBy: varchar("deletedBy", { length: 50 }).notNull(), // 刪除方式：'auto' 或 'manual'
  reason: text("reason"), // 清理原因
}, (table) => ({
  deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
  deletedByIdx: index("deleted_by_idx").on(table.deletedBy),
}));

export type ImageCleanupLog = typeof imageCleanupLogs.$inferSelect;
export type InsertImageCleanupLog = typeof imageCleanupLogs.$inferInsert;

/**
 * 通知表 - 記錄評價回覆通知
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), // 接收通知的用戶
  type: mysqlEnum("type", ["review_reply", "review_question", "contact"]).notNull(), // 通知類型
  title: varchar("title", { length: 255 }).notNull(), // 通知標題
  content: text("content").notNull(), // 通知內容
  reviewId: int("reviewId").references(() => reviews.id, { onDelete: "cascade" }), // 相關評價（可選）
  replyId: int("replyId").references(() => reviewReplies.id, { onDelete: "cascade" }), // 相關回覆（可選）
  fromUserId: int("fromUserId").references(() => users.id, { onDelete: "cascade" }), // 發送者（可選）
  relatedId: int("relatedId"), // 相關 ID（通用，可選）
  isRead: boolean("isRead").default(false).notNull(), // 是否已讀
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  reviewIdx: index("review_idx").on(table.reviewId),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
