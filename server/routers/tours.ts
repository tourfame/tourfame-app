import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getFeaturedTours,
  getNoShoppingTours,
  searchTours,
  getTourById,
  incrementTourViewCount,
  createRating,
  getTourRatings,
  createComment,
  getTourComments,
  deleteComment,
  getAllAgencies,
  createReview,
  getTourReviews,
  getUserReviews,
  deleteReview,
  markReviewHelpful,
  createReviewReply,
  getReviewReplies,
  deleteReviewReply,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkIsFavorited,
  recordViewHistory,
  getUserViewHistory,
  getRecommendations,
  createNotification,
} from "../db";

export const toursRouter = router({
  // Get featured tours for homepage
  getFeatured: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(5),
      })
    )
    .query(async ({ input }) => {
      return await getFeaturedTours(input.limit);
    }),

  // Get no shopping tours
  getNoShopping: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return await getNoShoppingTours(input.limit);
    }),

  // Search tours with filters
  search: publicProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minDays: z.number().optional(),
        maxDays: z.number().optional(),
        agencyId: z.number().optional(),
        sortBy: z.string().optional().default("rating_desc"),
        limit: z.number().min(1).max(100).optional().default(100),
      })
    )
    .query(async ({ input }) => {
      return await searchTours(input);
    }),

  // Get tour by ID
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const tour = await getTourById(input.id);
      if (!tour) {
        throw new Error("Tour not found");
      }
      return tour;
    }),

  // Get all agencies
  getAgencies: publicProcedure.query(async () => {
    return await getAllAgencies();
  }),

  // Update agency contact info
  updateAgency: publicProcedure
    .input(
      z.object({
        agencyId: z.number(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { updateAgency } = await import("../db");
      await updateAgency(input.agencyId, {
        phone: input.phone,
        whatsapp: input.whatsapp,
      });
      return { success: true };
    }),

  // Create agency
  createAgency: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "旅行社名稱不能為空"),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { createAgency } = await import("../db");
      const newAgency = await createAgency({
        name: input.name,
        phone: input.phone,
        whatsapp: input.whatsapp,
      });
      return newAgency;
    }),

  // Delete agency
  deleteAgency: publicProcedure
    .input(
      z.object({
        agencyId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { deleteAgency } = await import("../db");
      await deleteAgency(input.agencyId);
      return { success: true };
    }),

  // Update agency sort order
  updateAgencySortOrder: publicProcedure
    .input(
      z.object({
        agencyId: z.number(),
        sortOrder: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { updateAgency } = await import("../db");
      await updateAgency(input.agencyId, {
        sortOrder: input.sortOrder,
      });
      return { success: true };
    }),

  // Swap sort order of two agencies
  swapAgencySortOrder: publicProcedure
    .input(
      z.object({
        agencyId1: z.number(),
        agencyId2: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { swapAgencySortOrder } = await import("../db");
      await swapAgencySortOrder(input.agencyId1, input.agencyId2);
      return { success: true };
    }),

  // Toggle tour publish status
  togglePublish: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
        isPublished: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new Error("沒有權限");
      }
      const { toggleTourPublish } = await import("../db");
      await toggleTourPublish(input.tourId, input.isPublished);
      return { success: true };
    }),

  // Create rating
  createRating: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入再評分");
      }
      const ratingId = await createRating({
        tourId: input.tourId,
        userId: ctx.user.id,
        rating: input.rating,
      });
      return { success: true, ratingId };
    }),

  // Get tour ratings
  getTourRatings: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getTourRatings(input.tourId);
    }),

  // Create comment
  createComment: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
        content: z.string().min(1).max(1000),
        isAnonymous: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入再留言");
      }
      const commentId = await createComment({
        tourId: input.tourId,
        userId: ctx.user.id,
        content: input.content,
        isAnonymous: input.isAnonymous,
      });
      return { success: true, commentId };
    }),

  // Get tour comments
  getTourComments: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getTourComments(input.tourId);
    }),

  // Delete comment
  deleteComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await deleteComment(input.commentId, ctx.user.id);
      return { success: true };
    }),

  // Create review
  createReview: publicProcedure
    .input(
      z.object({
        tourId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string().min(10),
        photos: z.array(z.string()).optional(),
        travelDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入再發布評價");
      }
      const reviewId = await createReview({
        tourId: input.tourId,
        userId: ctx.user.id,
        rating: input.rating,
        title: input.title,
        content: input.content,
        photos: input.photos,
        travelDate: input.travelDate ? new Date(input.travelDate) : undefined,
      });
      return { reviewId };
    }),

  // Get tour reviews
  getTourReviews: publicProcedure
    .input(z.object({ tourId: z.number() }))
    .query(async ({ input }) => {
      return await getTourReviews(input.tourId);
    }),

  // Get user reviews
  getUserReviews: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("請先登入");
    }
    return await getUserReviews(ctx.user.id);
  }),

  // Delete review
  deleteReview: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await deleteReview(input.reviewId, ctx.user.id);
      return { success: true };
    }),

  // Mark review as helpful
  markReviewHelpful: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      await markReviewHelpful(input.reviewId);
      return { success: true };
    }),

  // Create review reply
  createReviewReply: publicProcedure
    .input(
      z.object({
        reviewId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入再回覆");
      }
      
      // Get the review to check if user is the author
      const reviews = await getTourReviews(0); // Get all reviews
      const review = reviews.find((r: any) => r.id === input.reviewId);
      const isAuthorReply = review ? review.userId === ctx.user.id : false;
      
      const result = await createReviewReply({
        reviewId: input.reviewId,
        userId: ctx.user.id,
        content: input.content,
        isAuthorReply,
      });
      
      // Create notifications
      if (review) {
        if (isAuthorReply) {
          // If author is replying, notify all non-author users who have replied
          const allReplies = await getReviewReplies(input.reviewId);
          const uniqueUserIds = new Set<number>();
          
          allReplies.forEach((reply: any) => {
            if (ctx.user && reply.userId !== ctx.user.id && reply.userId !== review.userId) {
              uniqueUserIds.add(reply.userId);
            }
          });
          
          // Create notification for each unique user
          for (const userId of Array.from(uniqueUserIds)) {
            await createNotification({
              userId,
              type: "review_reply",
              title: `${review.userName || "評價作者"}回覆了您`,
              content: input.content,
              reviewId: input.reviewId,
              replyId: result,
              fromUserId: ctx.user.id,
              tourId: review.tourId,
            });
          }
        } else {
          // If non-author is asking/replying, notify the review author
          if (review.userId !== ctx.user.id) {
            await createNotification({
              userId: review.userId,
              type: "review_question",
              title: `${ctx.user.name || "用戶"}向您提問`,
              content: input.content,
              reviewId: input.reviewId,
              replyId: result,
              fromUserId: ctx.user.id,
              tourId: review.tourId,
            });
          }
        }
      }
      
      return { success: true, replyId: result };
    }),

  // Get review replies
  getReviewReplies: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .query(async ({ input }) => {
      return await getReviewReplies(input.reviewId);
    }),

  // Delete review reply
  deleteReviewReply: publicProcedure
    .input(z.object({ replyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await deleteReviewReply(input.replyId, ctx.user.id);
      return { success: true };
    }),

  // Add to favorites
  addFavorite: publicProcedure
    .input(z.object({ tourId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      const favoriteId = await addFavorite(ctx.user.id, input.tourId);
      return { success: true, favoriteId };
    }),

  // Remove from favorites
  removeFavorite: publicProcedure
    .input(z.object({ tourId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await removeFavorite(ctx.user.id, input.tourId);
      return { success: true };
    }),

  // Get user favorites
  getUserFavorites: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("請先登入");
    }
    return await getUserFavorites(ctx.user.id);
  }),

  // Check if tour is favorited
  checkIsFavorited: publicProcedure
    .input(z.object({ tourId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        return { isFavorited: false };
      }
      const isFavorited = await checkIsFavorited(ctx.user.id, input.tourId);
      return { isFavorited };
    }),

  // Record view history
  recordViewHistory: publicProcedure
    .input(z.object({ tourId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || null;
      await recordViewHistory(userId, input.tourId);
      return { success: true };
    }),

  // Get user view history
  getUserViewHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(20) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      return await getUserViewHistory(ctx.user.id, input.limit);
    }),

  // Get personalized recommendations
  getRecommendations: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(12) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入以查看個人化推薦");
      }
      return await getRecommendations(ctx.user.id, input.limit);
    }),

  // ==================== Advertisement ====================

  /**
   * 獲取推薦旅行團（搜尋結果頂部）
   */
  getFeaturedTourAds: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).optional().default(3) }))
    .query(async ({ input }) => {
      const { getFeaturedTourAds } = await import("../db");
      return await getFeaturedTourAds(input.limit);
    }),

  /**
   * 獲取精選旅行社（首頁）
   */
  getFeaturedAgencyAds: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).optional().default(6) }))
    .query(async ({ input }) => {
      const { getFeaturedAgencyAds } = await import("../db");
      return await getFeaturedAgencyAds(input.limit);
    }),

  /**
   * 記錄廣告點擊
   */
  trackAdClick: publicProcedure
    .input(z.object({ advertisementId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { trackAdClick } = await import("../db");
      await trackAdClick({
        advertisementId: input.advertisementId,
        userId: ctx.user?.id,
      });
      return { success: true };
    }),

  /**
   * 獲取指定位置的活躍廣告
   */
  getActiveAdsByPlacement: publicProcedure
    .input(z.object({ 
      placement: z.enum(["home_top", "recommendations_top", "favorites_top", "search_top", "notifications_top"]),
      limit: z.number().min(1).max(10).optional().default(1),
    }))
    .query(async ({ input }) => {
      const { getActiveAdvertisements } = await import("../db");
      return await getActiveAdvertisements(input.placement, input.limit);
    }),
});
