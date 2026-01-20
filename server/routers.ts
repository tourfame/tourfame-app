import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { toursRouter } from "./routers/tours";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  tours: toursRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
