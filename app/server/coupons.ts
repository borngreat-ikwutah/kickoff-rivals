import { createServerFn } from "@tanstack/react-start";
import { db, coupons, couponRedemptions, users, auditLogs } from "../lib/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import jwt from "jsonwebtoken";

// ==========================================
// CONSTANTS
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const ADMIN_WALLETS = (process.env.ADMIN_KEY || "0x1fb34678C8c3A9d8AAe8ceb3320BbEB8b830ad65")
  .split(",")
  .map((addr) => addr.toLowerCase().trim());

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function verifyAdminToken(token: string): { valid: boolean; address?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
    if (ADMIN_WALLETS.includes(decoded.address.toLowerCase())) {
      return { valid: true, address: decoded.address };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

async function logAudit(action: string, actor: string, details: string, ip?: string) {
  try {
    await db.insert(auditLogs).values({
      action,
      actor,
      details,
      ip: ip || "unknown",
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

// ==========================================
// VERIFY COUPON
// ==========================================

const verifyCouponSchema = z.object({
  code: z.string().min(1),
  walletAddress: z.string().min(1),
});

export const verifyCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifyCouponSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();
    const codeUpper = data.code.toUpperCase().trim();

    try {
      // Find coupon
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, codeUpper),
      });

      if (!coupon) {
        return { success: false, error: "Invalid coupon code" };
      }

      if (!coupon.isActive) {
        return { success: false, error: "Coupon is no longer active" };
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { success: false, error: "Coupon has expired" };
      }

      if (coupon.currentUsage >= coupon.usageLimit) {
        return { success: false, error: "Coupon usage limit reached" };
      }

      // Check if user already redeemed
      const existingRedemption = await db.query.couponRedemptions.findFirst({
        where: and(
          eq(couponRedemptions.walletAddress, normalized),
          eq(couponRedemptions.couponCode, codeUpper)
        ),
      });

      if (existingRedemption) {
        return { success: false, error: "You have already redeemed this coupon" };
      }

      // Apply reward based on type
      let message = "";
      if (coupon.type === "coins") {
        const coinValue = parseInt(coupon.value, 10);
        await db
          .update(users)
          .set({
            coins: sql`${users.coins} + ${coinValue}`,
          })
          .where(eq(users.walletAddress, normalized));
        message = `Added ${coinValue} coins to your account!`;
      } else if (coupon.type === "theme") {
        await db
          .update(users)
          .set({
            activeTheme: coupon.value,
          })
          .where(eq(users.walletAddress, normalized));
        message = `Unlocked ${coupon.value} theme!`;
      }

      // Record redemption
      await db.insert(couponRedemptions).values({
        walletAddress: normalized,
        couponCode: codeUpper,
      });

      // Increment usage
      await db
        .update(coupons)
        .set({
          currentUsage: coupon.currentUsage + 1,
        })
        .where(eq(coupons.code, codeUpper));

      // Log audit
      await logAudit("COUPON_REDEEMED", normalized, `Redeemed coupon: ${codeUpper}`);

      return {
        success: true,
        type: coupon.type,
        value: coupon.type === "coins" ? parseInt(coupon.value, 10) : coupon.value,
        message,
      };
    } catch (error: any) {
      console.error("Failed to verify coupon:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// CREATE COUPON (ADMIN)
// ==========================================

const createCouponSchema = z.object({
  token: z.string(),
  code: z.string().min(1),
  type: z.enum(["coins", "theme"]),
  value: z.string(),
  usageLimit: z.number().min(1).default(1),
  expiresAt: z.string().optional(),
});

export const createCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createCouponSchema.parse(data))
  .handler(async ({ data }) => {
    // Verify admin
    const auth = verifyAdminToken(data.token);
    if (!auth.valid) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const codeUpper = data.code.toUpperCase().trim();

      // Check if coupon already exists
      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.code, codeUpper),
      });

      if (existing) {
        return { success: false, error: "Coupon code already exists" };
      }

      // Create coupon
      const [newCoupon] = await db
        .insert(coupons)
        .values({
          code: codeUpper,
          type: data.type,
          value: data.value,
          usageLimit: data.usageLimit,
          currentUsage: 0,
          isActive: true,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        })
        .returning();

      // Log audit
      await logAudit(
        "COUPON_CREATED",
        auth.address || "admin",
        `Created coupon: ${codeUpper} (${data.type}: ${data.value})`
      );

      return {
        success: true,
        coupon: newCoupon,
      };
    } catch (error: any) {
      console.error("Failed to create coupon:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// LIST COUPONS (ADMIN)
// ==========================================

const listCouponsSchema = z.object({
  token: z.string(),
});

export const listCoupons = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listCouponsSchema.parse(data))
  .handler(async ({ data }) => {
    // Verify admin
    const auth = verifyAdminToken(data.token);
    if (!auth.valid) {
      return { success: false, error: "Unauthorized", coupons: [] };
    }

    try {
      const allCoupons = await db.select().from(coupons);

      return {
        success: true,
        coupons: allCoupons,
      };
    } catch (error: any) {
      console.error("Failed to list coupons:", error);
      return { success: false, error: error.message, coupons: [] };
    }
  });

// ==========================================
// DELETE COUPON (ADMIN)
// ==========================================

const deleteCouponSchema = z.object({
  token: z.string(),
  code: z.string(),
});

export const deleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteCouponSchema.parse(data))
  .handler(async ({ data }) => {
    // Verify admin
    const auth = verifyAdminToken(data.token);
    if (!auth.valid) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const codeUpper = data.code.toUpperCase().trim();

      await db.delete(coupons).where(eq(coupons.code, codeUpper));

      // Log audit
      await logAudit(
        "COUPON_DELETED",
        auth.address || "admin",
        `Deleted coupon: ${codeUpper}`
      );

      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete coupon:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// ADMIN VERIFY
// ==========================================

const adminVerifySchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  message: z.string(),
});

export const adminVerify = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminVerifySchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    // Check if wallet is admin
    if (!ADMIN_WALLETS.includes(normalized)) {
      return { success: false, error: "Not authorized" };
    }

    // In production, verify the signature here using ethers/viem
    // For now, we just check if the wallet is in the admin list

    // Generate JWT token
    const token = jwt.sign(
      { address: normalized, type: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log audit
    await logAudit("ADMIN_LOGIN", normalized, "Admin logged in");

    return {
      success: true,
      token,
      expiresIn: 24 * 60 * 60 * 1000, // 24 hours in ms
    };
  });

// ==========================================
// ADMIN LOGOUT
// ==========================================

const adminLogoutSchema = z.object({
  token: z.string(),
});

export const adminLogout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminLogoutSchema.parse(data))
  .handler(async ({ data }) => {
    // Verify token first
    const auth = verifyAdminToken(data.token);
    if (auth.valid && auth.address) {
      await logAudit("ADMIN_LOGOUT", auth.address, "Admin logged out");
    }

    // In a real implementation, you might want to blacklist the token
    // For now, we just acknowledge the logout

    return { success: true };
  });

// ==========================================
// VERIFY ADMIN SESSION
// ==========================================

const verifySessionSchema = z.object({
  token: z.string(),
});

export const verifyAdminSession = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => verifySessionSchema.parse(data))
  .handler(async ({ data }) => {
    const auth = verifyAdminToken(data.token);
    return {
      valid: auth.valid,
      address: auth.address,
    };
  });

// ==========================================
// GET ADMIN STATS
// ==========================================

const getAdminStatsSchema = z.object({
  token: z.string(),
});

export const getAdminStats = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getAdminStatsSchema.parse(data))
  .handler(async ({ data }) => {
    // Verify admin
    const auth = verifyAdminToken(data.token);
    if (!auth.valid) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      // Get user count
      const userCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      // Get total bets value
      const totalBetsResult = await db
        .select({ total: sql<number>`sum(${users.totalBets})` })
        .from(users);

      // Get active coupons count
      const activeCouponsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(coupons)
        .where(eq(coupons.isActive, true));

      return {
        success: true,
        stats: {
          totalUsers: Number(userCount[0]?.count) || 0,
          totalBets: Number(totalBetsResult[0]?.total) || 0,
          activeCoupons: Number(activeCouponsResult[0]?.count) || 0,
        },
      };
    } catch (error: any) {
      console.error("Failed to get admin stats:", error);
      return { success: false, error: error.message };
    }
  });
