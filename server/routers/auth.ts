import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createUser,
  getUserByEmail,
  getUserByName,
  getUserById,
  verifyPassword,
  updateUserLastSignIn,
  setPasswordResetToken,
  getUserByResetToken,
  resetUserPassword,
} from "../db";
import { sendPasswordResetEmail } from "../_core/email";
import crypto from "crypto";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

// Generate JWT token
async function generateToken(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export const authRouter = router({
  // Get current user
  me: publicProcedure.query(({ ctx }) => ctx.user),

  // Register new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("請輸入有效的電郵地址"),
        password: z.string().min(6, "密碼至少需要 6 個字符"),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Normalize email to lowercase
      const normalizedEmail = input.email.toLowerCase();
      
      // Check if email already exists
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "此電郵已被註冊",
        });
      }

      // Check if username already exists (if provided)
      if (input.name) {
        const existingUserByName = await getUserByName(input.name);
        if (existingUserByName) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "此用戶名稱已被使用，請選擇其他名稱",
          });
        }
      }

      // Create user
      await createUser({
        email: normalizedEmail,
        password: input.password,
        name: input.name,
        role: "user",
      });

      // Get user data by email
      const user = await getUserByEmail(normalizedEmail);

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "註冊失敗",
        });
      }

      // Generate token
      const token = await generateToken(user.id);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          : null,
      };
    }),

  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("請輸入有效的電郵地址"),
        password: z.string().min(1, "請輸入密碼"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Normalize email to lowercase
      const normalizedEmail = input.email.toLowerCase();
      
      // Find user
      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "電郵或密碼錯誤",
        });
      }

      // Verify password
      const isValid = await verifyPassword(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "電郵或密碼錯誤",
        });
      }

      // Update last sign in
      await updateUserLastSignIn(user.id);

      // Generate token
      const token = await generateToken(user.id);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  // Forgot password
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email("請輸入有效的電郵地址"),
      })
    )
    .mutation(async ({ input }) => {
      // Normalize email to lowercase
      const normalizedEmail = input.email.toLowerCase();
      
      // Check if user exists
      const user = await getUserByEmail(normalizedEmail);
      
      // For security reasons, always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        return {
          success: true,
          message: "如果該電郵地址存在，我們已發送重設密碼連結",
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await setPasswordResetToken(user.id, resetToken, expiryDate);

      // Send email
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name || user.email
      );

      if (!emailSent) {
        console.error("[Auth] Failed to send password reset email to", user.email);
      }

      return {
        success: true,
        message: "如果該電郵地址存在，我們已發送重設密碼連結",
      };
    }),

  // Reset password
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "無效的重設連結"),
        newPassword: z.string().min(6, "密碼至少需要 6 個字符"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find user by reset token
      const user = await getUserByResetToken(input.token);

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "重設連結無效或已過期",
        });
      }

      // Check if token is expired
      if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "重設連結已過期",
        });
      }

      // Reset password
      await resetUserPassword(user.id, input.newPassword);

      // Generate new token for auto-login
      const token = await generateToken(user.id);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        message: "密碼重設成功",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),
});
