import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  createNotification,
  getAllAdminUsers,
} from "../db";

export const notificationsRouter = router({
  // Get user notifications
  getNotifications: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      return await getUserNotifications(ctx.user.id, input?.limit);
    }),

  // Mark notification as read
  markAsRead: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await markNotificationAsRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("請先登入");
    }
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  // Get unread count
  getUnreadCount: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return 0;
    }
    return await getUnreadNotificationCount(ctx.user.id);
  }),

  // Delete notification
  deleteNotification: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("請先登入");
      }
      await deleteNotification(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  // Create contact notification for admins
  createContactNotification: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        subject: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Get all admin users
      const adminUsers = await getAllAdminUsers();

      // Create notification for each admin
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin.id,
          type: "contact",
          title: input.name,
          content: `主旨：${input.subject}\n\n${input.message}\n\n電郵：${input.email}`,
        });
      }

      return { success: true };
    }),
});
