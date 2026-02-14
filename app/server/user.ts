import { createServerFn } from "@tanstack/react-start";
import { db, users, transactions, userQuests } from "../lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateUniqueUsername(): string {
  const adjectives = [
    "Rival",
    "Swift",
    "Prime",
    "Elite",
    "Bold",
    "Fierce",
    "Sharp",
    "Quick",
  ];
  const nouns = [
    "Panda",
    "Fox",
    "Tiger",
    "Eagle",
    "Wolf",
    "Bear",
    "Lion",
    "Falcon",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==========================================
// GET OR CREATE USER
// ==========================================

const getOrCreateUserSchema = z.object({
  walletAddress: z.string().min(1),
  username: z.string().optional(),
  leagueId: z.string().optional(),
  teamId: z.string().optional(),
});

export const getOrCreateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => getOrCreateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    // Try to find existing user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (existingUser) {
      return {
        success: true,
        user: existingUser,
        isNew: false,
      };
    }

    // Create new user
    const username = data.username || generateUniqueUsername();
    const referralCode = generateReferralCode();

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          walletAddress: normalized,
          username,
          allianceLeagueId: data.leagueId || null,
          allianceTeamId: data.teamId || null,
          referralCode,
          coins: 1000,
          doodlBalance: 1000,
        })
        .returning();

      return {
        success: true,
        user: newUser,
        isNew: true,
      };
    } catch (error: any) {
      // Handle username conflict
      if (error.code === "23505" && error.message?.includes("username")) {
        const retryUsername = `${username}${Math.floor(100 + Math.random() * 900)}`;
        const [newUser] = await db
          .insert(users)
          .values({
            walletAddress: normalized,
            username: retryUsername,
            allianceLeagueId: data.leagueId || null,
            allianceTeamId: data.teamId || null,
            referralCode,
            coins: 1000,
            doodlBalance: 1000,
          })
          .returning();

        return {
          success: true,
          user: newUser,
          isNew: true,
        };
      }
      throw error;
    }
  });

// ==========================================
// GET USER PROFILE
// ==========================================

const getUserProfileSchema = z.object({
  walletAddress: z.string().min(1),
  username: z.string().optional(),
  leagueId: z.string().optional(),
  teamId: z.string().optional(),
});

export const getUserProfile = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getUserProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const result = await getOrCreateUser({ data });

    if (!result.success || !result.user) {
      return { success: false, error: "Failed to get user" };
    }

    const user = result.user;

    // Check welcome gift status
    let canClaimWelcomeGift = true;
    let nextGiftClaimIn = 0;

    if (user.lastWelcomeGiftDate) {
      const lastGift = new Date(user.lastWelcomeGiftDate);
      const now = new Date();
      const hoursSince =
        (now.getTime() - lastGift.getTime()) / (1000 * 60 * 60);
      canClaimWelcomeGift = hoursSince >= 24;
      nextGiftClaimIn = canClaimWelcomeGift ? 0 : Math.ceil(24 - hoursSince);
    }

    return {
      success: true,
      walletAddress: user.walletAddress,
      username: user.username,
      coins: user.coins,
      korBalance: user.doodlBalance,
      allianceLeagueId: user.allianceLeagueId,
      allianceTeamId: user.allianceTeamId,
      unclaimedAllianceRewards: user.unclaimedAllianceRewards,
      gamePlays: user.gamePlays,
      canClaimWelcomeGift,
      nextGiftClaimIn,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings,
    };
  });

// ==========================================
// REGISTER REFERRAL
// ==========================================

const registerReferralSchema = z.object({
  walletAddress: z.string().min(1),
  referralCode: z.string().min(1),
});

export const registerReferral = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerReferralSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    // Get the user
    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.referredBy) {
      return { success: false, error: "Already referred" };
    }

    // Find referrer
    const referrer = await db.query.users.findFirst({
      where: eq(users.referralCode, data.referralCode.toUpperCase()),
    });

    if (!referrer) {
      return { success: false, error: "Referral code not found" };
    }

    if (referrer.walletAddress === user.walletAddress) {
      return { success: false, error: "Cannot refer self" };
    }

    const REWARD_AMOUNT = 50;

    // Update user with referrer
    await db
      .update(users)
      .set({ referredBy: referrer.walletAddress })
      .where(eq(users.walletAddress, user.walletAddress));

    // Update referrer's stats
    await db
      .update(users)
      .set({
        referralCount: (referrer.referralCount || 0) + 1,
        referralEarnings: (referrer.referralEarnings || 0) + REWARD_AMOUNT,
        doodlBalance: (referrer.doodlBalance || 0) + REWARD_AMOUNT,
      })
      .where(eq(users.walletAddress, referrer.walletAddress));

    // Log transaction for referrer
    await db.insert(transactions).values({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletAddress: referrer.walletAddress,
      type: "referral",
      amount: REWARD_AMOUNT,
      currency: "kor",
      description: `Referral Bonus: ${user.username}`,
    });

    return { success: true, message: "Referral registered" };
  });

// ==========================================
// CLAIM WELCOME GIFT
// ==========================================

const claimWelcomeGiftSchema = z.object({
  walletAddress: z.string().min(1),
});

export const claimWelcomeGift = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => claimWelcomeGiftSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if can claim
    let isFirstTime = !user.lastWelcomeGiftDate;
    let canClaim = true;
    let nextClaimIn = 0;

    if (user.lastWelcomeGiftDate) {
      const lastGift = new Date(user.lastWelcomeGiftDate);
      const now = new Date();
      const hoursSince =
        (now.getTime() - lastGift.getTime()) / (1000 * 60 * 60);
      canClaim = hoursSince >= 24;
      nextClaimIn = Math.ceil(24 - hoursSince);
    }

    if (!canClaim) {
      return {
        success: false,
        error: `Wait ${nextClaimIn} hours`,
      };
    }

    const reward = isFirstTime ? 500 : 100;

    await db
      .update(users)
      .set({
        coins: (user.coins || 0) + reward,
        lastWelcomeGiftDate: new Date(),
      })
      .where(eq(users.walletAddress, normalized));

    return {
      success: true,
      reward,
      message: `Claimed ${reward} coins!`,
    };
  });

// ==========================================
// CONVERT COINS TO KOR
// ==========================================

const convertCoinsSchema = z.object({
  walletAddress: z.string().min(1),
  amount: z.number().min(1000),
});

const CONVERSION_RATE = 1000; // 1000 coins = 100 KOR
const CONVERSION_YIELD = 100;

export const convertCoins = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => convertCoinsSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const coinsToConvert =
      Math.floor(data.amount / CONVERSION_RATE) * CONVERSION_RATE;

    if (coinsToConvert > (user.coins || 0)) {
      return { success: false, error: "Insufficient coins" };
    }

    const korToAdd = (coinsToConvert / CONVERSION_RATE) * CONVERSION_YIELD;

    const newCoins = (user.coins || 0) - coinsToConvert;
    const newKor = (user.doodlBalance || 0) + korToAdd;

    await db
      .update(users)
      .set({
        coins: newCoins,
        doodlBalance: newKor,
      })
      .where(eq(users.walletAddress, normalized));

    // Log transaction
    await db.insert(transactions).values({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletAddress: normalized,
      type: "convert",
      amount: korToAdd,
      currency: "kor",
      description: `Converted ${coinsToConvert} coins to ${korToAdd} KOR`,
    });

    return {
      success: true,
      coins: newCoins,
      korBalance: newKor,
    };
  });

// ==========================================
// CLAIM ALLIANCE REWARDS
// ==========================================

const claimAllianceRewardsSchema = z.object({
  walletAddress: z.string().min(1),
});

export const claimAllianceRewards = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => claimAllianceRewardsSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const unclaimed = user.unclaimedAllianceRewards || 0;

    if (unclaimed <= 0) {
      return { success: false, error: "No rewards to claim" };
    }

    await db
      .update(users)
      .set({
        doodlBalance: (user.doodlBalance || 0) + unclaimed,
        unclaimedAllianceRewards: 0,
      })
      .where(eq(users.walletAddress, normalized));

    // Log transaction
    await db.insert(transactions).values({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletAddress: normalized,
      type: "bonus",
      amount: unclaimed,
      currency: "kor",
      description: "Alliance Rewards",
    });

    return {
      success: true,
      claimed: unclaimed,
    };
  });

// ==========================================
// CHECK USERNAME AVAILABILITY
// ==========================================

const checkUsernameSchema = z.object({
  username: z.string().min(1),
});

export const checkUsernameAvailability = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => checkUsernameSchema.parse(data))
  .handler(async ({ data }) => {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    return {
      available: !existingUser,
    };
  });

// ==========================================
// RECORD GAME PLAY
// ==========================================

const recordGamePlaySchema = z.object({
  walletAddress: z.string().min(1),
});

export const recordGamePlay = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recordGamePlaySchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db
      .update(users)
      .set({
        gamePlays: (user.gamePlays || 0) + 1,
      })
      .where(eq(users.walletAddress, normalized));

    return {
      success: true,
      gamePlays: (user.gamePlays || 0) + 1,
    };
  });
