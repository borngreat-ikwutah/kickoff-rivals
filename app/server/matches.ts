import { createServerFn } from "@tanstack/react-start";
import {
  db,
  matches,
  teams,
  leagues,
  seasons,
  bets,
  users,
  transactions,
} from "../lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// ==========================================
// GET CURRENT MATCHES
// ==========================================

const getCurrentMatchesSchema = z.object({
  leagueId: z.string().optional(),
});

// ==========================================
// AUTO-GAME LOOP HELPERS
// ==========================================

import {
  ROUND_DURATION_SEC,
  MATCH_DURATION_SEC,
  RESULT_DURATION_SEC,
  TEAMS,
  LEAGUES,
} from "../constants";

// Helper to simulation events
function generateMatchEvents(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
) {
  const events = [];

  // Generate Home Goals
  for (let i = 0; i < homeScore; i++) {
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type: "goal",
      teamId: homeTeamId,
      description: "Goal triggered by simulation",
    });
  }

  // Generate Away Goals
  for (let i = 0; i < awayScore; i++) {
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type: "goal",
      teamId: awayTeamId,
      description: "Goal triggered by simulation",
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

// Helper to simulate match result
function simulateMatchResult(homeTeamId: string, awayTeamId: string) {
  // Simple simulation
  const homeScore = Math.floor(Math.random() * 5); // 0-4 goals
  const awayScore = Math.floor(Math.random() * 5); // 0-4 goals
  const events = generateMatchEvents(
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
  );

  return { homeScore, awayScore, events };
}

// Helper to start live match
async function startLiveMatch(seasonId: number, round: number) {
  const pendingMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.seasonId, seasonId),
        eq(matches.round, round),
        eq(matches.status, "SCHEDULED"),
      ),
    );

  for (const m of pendingMatches) {
    const { homeScore, awayScore, events } = simulateMatchResult(
      m.homeTeamId,
      m.awayTeamId,
    );

    await db
      .update(matches)
      .set({
        status: "LIVE",
        homeScore,
        awayScore,
        events: events as any,
        liveStartTime: new Date(),
      })
      .where(eq(matches.id, m.id));
  }
}

// Helper to generate next round matches
function generateNextRoundMatches(seasonId: number, roundNumber: number) {
  // ... (keep existing logic)
  const newMatches = [];

  const leaguesList = ["l1", "l2", "l3"];

  for (const leagueId of leaguesList) {
    const leagueTeams = TEAMS[leagueId] || [];
    if (leagueTeams.length < 2) continue;

    // Shuffle teams
    const shuffled = [...leagueTeams].sort(() => 0.5 - Math.random());

    // Pair them up
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 >= shuffled.length) break;

      const home = shuffled[i];
      const away = shuffled[i + 1];

      // status 'SCHEDULED'
      // start time NOW
      const matchId = `m-${seasonId}-${roundNumber}-${leagueId}-${i / 2}`;

      newMatches.push({
        id: matchId,
        leagueId,
        seasonId,
        round: roundNumber,
        homeTeamId: home.id,
        awayTeamId: away.id,
        status: "SCHEDULED",
        startTime: new Date(), // Starts immediately
        oddsHome: Number((1 + Math.random() * 2).toFixed(2)),
        oddsDraw: Number((2 + Math.random() * 2).toFixed(2)),
        oddsAway: Number((1 + Math.random() * 2).toFixed(2)),
        oddsGg: Number((1.5 + Math.random()).toFixed(2)),
        oddsNogg: Number((1.5 + Math.random()).toFixed(2)),
      });
    }
  }
  return newMatches;
}

export const getCurrentMatches = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getCurrentMatchesSchema.parse(data || {}))
  .handler(async ({ data }) => {
    try {
      // 1. SEEDING CHECK
      // Check if leagues exist
      const leagueCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(leagues);
      const leagueCount = Number(leagueCountRes[0].count);

      if (leagueCount === 0) {
        console.log("Seeding Leagues...");
        await db.insert(leagues).values(LEAGUES);
      }

      // Check if teams exist
      const teamCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(teams);
      const teamCount = Number(teamCountRes[0].count);

      if (teamCount === 0) {
        console.log("Seeding Teams...");
        const allTeams = Object.values(TEAMS)
          .flat()
          .map((t) => ({
            id: t.id,
            name: t.name,
            leagueId: t.leagueId,
            strength: t.strength,
            color: t.color,
          }));
        await db.insert(teams).values(allTeams);
      }

      // Get the active season
      let activeSeason = await db.query.seasons.findFirst({
        where: eq(seasons.isActive, true),
        orderBy: desc(seasons.id),
      });

      if (!activeSeason) {
        // Create season if none
        const [newSeason] = await db
          .insert(seasons)
          .values({ isActive: true, currentRound: 1 })
          .returning();
        activeSeason = newSeason;
      }

      // Check specifically for latest round via matches (more reliable than season.currentRound sometimes)
      const latestMatch = await db.query.matches.findFirst({
        where: eq(matches.seasonId, activeSeason.id),
        orderBy: desc(matches.startTime),
      });

      const now = new Date();
      let currentRound = latestMatch?.round || 0;

      // Calculate Active Round Times
      // If no latestMatch, we assume we need to start fresh immediately.
      const bettingEndTime = latestMatch
        ? new Date(latestMatch.startTime.getTime() + ROUND_DURATION_SEC * 1000)
        : new Date(0);
      const matchEndTime = latestMatch
        ? new Date(
            latestMatch.startTime.getTime() +
              (ROUND_DURATION_SEC + MATCH_DURATION_SEC) * 1000,
          )
        : new Date(0);
      const resultEndTime = new Date(
        matchEndTime.getTime() + RESULT_DURATION_SEC * 1000,
      ); // RESULT PHASE

      let shouldProcessNextRound = false;

      if (!latestMatch) {
        // No active matches -> Start Round 1
        shouldProcessNextRound = true;
        currentRound = 0;
      } else {
        if (now > matchEndTime) {
          // Round Period Over (Match Finished)
          // Ensure matches are settled (Simulation)
          const pendingMatches = await db
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.seasonId, activeSeason.id),
                eq(matches.round, currentRound),
              ),
            );

          let anyUpdates = false;
          for (const m of pendingMatches) {
            if (m.status === "FINISHED") continue;

            anyUpdates = true;
            let homeScore = m.homeScore;
            let awayScore = m.awayScore;
            let events = m.events;

            if (
              m.status === "SCHEDULED" ||
              m.status === "LIVE" ||
              homeScore === null
            ) {
              // Fallback simulation if skipped LIVE phase or incomplete
              const sim = simulateMatchResult(m.homeTeamId, m.awayTeamId);
              homeScore = sim.homeScore;
              awayScore = sim.awayScore;
              events = sim.events as any;
            }

            // Update Match to FINISHED
            await db
              .update(matches)
              .set({ status: "FINISHED", homeScore, awayScore, events })
              .where(eq(matches.id, m.id));

            // Settle Bets
            const matchBets = await db
              .select()
              .from(bets)
              .where(and(eq(bets.matchId, m.id), eq(bets.status, "pending")));
            for (const bet of matchBets) {
              let won = false;
              switch (bet.selection) {
                case "home":
                  won = homeScore! > awayScore!;
                  break;
                case "draw":
                  won = homeScore === awayScore;
                  break;
                case "away":
                  won = awayScore! > homeScore!;
                  break;
                case "gg":
                  won = homeScore! > 0 && awayScore! > 0;
                  break;
                case "nogg":
                  won = homeScore === 0 || awayScore === 0;
                  break;
              }
              await db
                .update(bets)
                .set({ status: won ? "won" : "lost", settledAt: new Date() })
                .where(eq(bets.id, bet.id));

              if (won && bet.betType === "single") {
                await db
                  .update(users)
                  .set({
                    doodlBalance: sql`${users.doodlBalance} + ${bet.potentialReturn}`,
                    wins: sql`${users.wins} + 1`,
                  })
                  .where(eq(users.walletAddress, bet.walletAddress));

                await db.insert(transactions).values({
                  id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                  walletAddress: bet.walletAddress,
                  type: "win",
                  amount: bet.potentialReturn,
                  currency: "kor",
                  description: `Bet win (Auto)`,
                });
              }
            }
          }
        }

        if (now > resultEndTime) {
          shouldProcessNextRound = true;
        } else if (now > bettingEndTime && now <= matchEndTime) {
          // LIVE Phase start
          const scheduledMatches = await db
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.seasonId, activeSeason.id),
                eq(matches.round, currentRound),
                eq(matches.status, "SCHEDULED"),
              ),
            );

          if (scheduledMatches.length > 0) {
            await startLiveMatch(activeSeason.id, currentRound);
          }
        }
      }

      if (shouldProcessNextRound) {
        // Create Next Round
        const nextRound = currentRound + 1;
        const newMatchesData = generateNextRoundMatches(
          activeSeason.id,
          nextRound,
        );

        if (newMatchesData.length > 0) {
          await db.insert(matches).values(newMatchesData);
          await db
            .update(seasons)
            .set({ currentRound: nextRound })
            .where(eq(seasons.id, activeSeason.id));
        }
      }

      // Fetch ACTIVE matches (latest round)
      // Since we might have just created them, we query by season desc again or specifically round
      const currentActiveRound =
        (shouldProcessNextRound ? currentRound + 1 : currentRound) || 1;

      // Build query conditions
      const conditions = [
        eq(matches.seasonId, activeSeason.id),
        eq(matches.round, currentActiveRound),
      ];
      if (data.leagueId) {
        conditions.push(eq(matches.leagueId, data.leagueId));
      }

      // Get matches with team info
      const matchList = await db
        .select({
          id: matches.id,
          // ... all fields ...
          leagueId: matches.leagueId,
          seasonId: matches.seasonId,
          round: matches.round,
          homeTeamId: matches.homeTeamId,
          awayTeamId: matches.awayTeamId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          status: matches.status,
          startTime: matches.startTime,
          liveStartTime:
            matches.liveStartTime /** Note: we didn't set this in generation, but it's optional */,
          oddsHome: matches.oddsHome,
          oddsDraw: matches.oddsDraw,
          oddsAway: matches.oddsAway,
          oddsGg: matches.oddsGg,
          oddsNogg: matches.oddsNogg,
          roundHash: matches.roundHash,
          commitHash: matches.commitHash,
          blockHash: matches.blockHash,
          events: matches.events,
        })
        .from(matches)
        .where(and(...conditions))
        .orderBy(matches.startTime);

      // Get team names for all matches
      const teamIds = new Set<string>();
      matchList.forEach((m) => {
        teamIds.add(m.homeTeamId);
        teamIds.add(m.awayTeamId);
      });

      const teamList = await db
        .select()
        .from(teams)
        .where(
          sql`${teams.id} IN (${Array.from(teamIds)
            .map((id) => `'${id}'`)
            .join(",")})`,
        );

      const teamMap = new Map(teamList.map((t) => [t.id, t]));

      // Transform matches
      const transformedMatches = matchList.map((m) => {
        let homeTeam = teamMap.get(m.homeTeamId);
        let awayTeam = teamMap.get(m.awayTeamId);

        // FALLBACK: If not in DB, use constants
        const leagueTeams = TEAMS[m.leagueId] || [];

        if (!homeTeam) {
          const t = leagueTeams.find((t) => t.id === m.homeTeamId);
          if (t) {
            // Construct pseudo-DB object
            homeTeam = {
              id: t.id,
              name: t.name,
              leagueId: t.leagueId,
              strength: t.strength,
              color: t.color,
              createdAt: new Date(),
            } as any;
          } else {
            console.warn(`Team ${m.homeTeamId} not found in DB or Constants!`);
          }
        }

        if (!awayTeam) {
          const t = leagueTeams.find((t) => t.id === m.awayTeamId);
          if (t) {
            awayTeam = {
              id: t.id,
              name: t.name,
              leagueId: t.leagueId,
              strength: t.strength,
              color: t.color,
              createdAt: new Date(),
            } as any;
          }
        }

        // Logo Lookup
        const homeLogo = leagueTeams.find((t) => t.id === m.homeTeamId)?.logo;
        const awayLogo = leagueTeams.find((t) => t.id === m.awayTeamId)?.logo;

        // Calculate current score for LIVE matches based on elapsed time
        let currentHomeScore = m.homeScore;
        let currentAwayScore = m.awayScore;

        if (m.status === "LIVE" && m.liveStartTime && m.events) {
          const MATCH_DURATION_MS = MATCH_DURATION_SEC * 1000; // match duration from constants
          const elapsedMs = Date.now() - m.liveStartTime.getTime();
          const progress = Math.min(1, elapsedMs / MATCH_DURATION_MS);
          const currentGameMinute = Math.floor(progress * 90);

          let h = 0;
          let a = 0;
          const eventsList = Array.isArray(m.events) ? m.events : [];
          eventsList.forEach((e: any) => {
            if (e.type === "goal" && e.minute <= currentGameMinute) {
              if (e.teamId === m.homeTeamId) h++;
              else a++;
            }
          });
          currentHomeScore = h;
          currentAwayScore = a;
        }

        return {
          id: m.id,
          leagueId: m.leagueId,
          league_id: m.leagueId,
          seasonId: m.seasonId,
          season_id: m.seasonId,
          round: m.round,
          round_number: m.round,
          home_team_id: m.homeTeamId,
          away_team_id: m.awayTeamId,
          home_team_name: homeTeam?.name || "Unknown",
          away_team_name: awayTeam?.name || "Unknown",
          homeTeam: {
            name: homeTeam?.name || "Unknown Team",
            color: homeTeam?.color || "#000",
            logo: homeLogo,
            ...homeTeam,
          },
          awayTeam: {
            name: awayTeam?.name || "Unknown Team",
            color: awayTeam?.color || "#000",
            logo: awayLogo,
            ...awayTeam,
          },
          homeScore: currentHomeScore,
          awayScore: currentAwayScore,
          status: m.status?.toUpperCase() || "SCHEDULED", // Ensure UPPERCASE for UI
          scheduled_time: m.startTime?.toISOString(),
          startTime: m.startTime?.toISOString(), // UI might use this
          live_start_time: m.liveStartTime?.toISOString(),
          odds: {
            home: m.oddsHome,
            draw: m.oddsDraw,
            away: m.oddsAway,
            gg: m.oddsGg,
            nogg: m.oddsNogg,
          },
          events: Array.isArray(m.events) ? m.events : [],
          result:
            currentHomeScore !== null && currentAwayScore !== null
              ? {
                  homeScore: currentHomeScore,
                  awayScore: currentAwayScore,
                  events: Array.isArray(m.events) ? m.events : [],
                }
              : null,
        };
      });

      return {
        success: true,
        matches: transformedMatches,
        serverTime: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Failed to get current matches:", error);
      return { success: false, error: error.message, matches: [] };
    }
  });

// ==========================================
// CREATE MATCHES
// ==========================================

const createMatchesSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      leagueId: z.string(),
      seasonId: z.number(),
      round: z.number(),
      homeTeam: z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        strength: z.number(),
        leagueId: z.string(),
      }),
      awayTeam: z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        strength: z.number(),
        leagueId: z.string(),
      }),
      startTime: z.number(),
      odds: z.object({
        home: z.number(),
        draw: z.number(),
        away: z.number(),
        gg: z.number(),
        nogg: z.number(),
      }),
      roundHash: z.string().optional(),
      commitHash: z.string().optional(),
    }),
  ),
});

export const createMatches = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createMatchesSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Ensure season exists
      let season = await db.query.seasons.findFirst({
        where: eq(seasons.id, data.matches[0]?.seasonId || 1),
      });

      if (!season) {
        const [newSeason] = await db
          .insert(seasons)
          .values({
            isActive: true,
            currentRound: data.matches[0]?.round || 1,
          })
          .returning();
        season = newSeason;
      }

      // Insert matches
      const matchValues = data.matches.map((m) => ({
        id: m.id,
        leagueId: m.leagueId,
        seasonId: season!.id,
        round: m.round,
        homeTeamId: m.homeTeam.id,
        awayTeamId: m.awayTeam.id,
        status: "SCHEDULED",
        startTime: new Date(m.startTime),
        oddsHome: m.odds.home,
        oddsDraw: m.odds.draw,
        oddsAway: m.odds.away,
        oddsGg: m.odds.gg,
        oddsNogg: m.odds.nogg,
        roundHash: m.roundHash,
        commitHash: m.commitHash,
      }));

      await db.insert(matches).values(matchValues).onConflictDoNothing();

      return {
        success: true,
        created: matchValues.length,
      };
    } catch (error: any) {
      console.error("Failed to create matches:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// UPDATE MATCH RESULT
// ==========================================

const updateMatchResultSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  events: z.array(z.any()).optional(),
  status: z.string().optional(),
});

export const updateMatchResult = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateMatchResultSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      await db
        .update(matches)
        .set({
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          events: data.events || [],
          status: data.status?.toUpperCase() || "FINISHED",
        })
        .where(eq(matches.id, data.matchId));

      return { success: true };
    } catch (error: any) {
      console.error("Failed to update match result:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// PLACE BET
// ==========================================

const placeBetSchema = z.object({
  walletAddress: z.string(),
  matchId: z.string(),
  selection: z.enum(["home", "draw", "away", "gg", "nogg"]),
  stake: z.number().min(1),
  odds: z.number(),
  betType: z.enum(["single", "accumulator"]).optional(),
});

export const placeBet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeBetSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalized),
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Check balance
      if ((user.doodlBalance || 0) < data.stake) {
        return { success: false, error: "Insufficient balance" };
      }

      // Check match exists and is open for betting
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, data.matchId),
      });

      if (!match) {
        return { success: false, error: "Match not found" };
      }

      // Allow betting during SCHEDULED or first 10 seconds of LIVE
      if (match.status === "FINISHED") {
        return { success: false, error: "Match already finished" };
      }

      if (match.status === "LIVE" && match.liveStartTime) {
        const elapsed = Date.now() - match.liveStartTime.getTime();
        if (elapsed > 10000) {
          return { success: false, error: "Betting window closed" };
        }
      }

      const potentialReturn = Math.floor(data.stake * data.odds);
      const betId = `bet-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Create bet
      await db.insert(bets).values({
        id: betId,
        walletAddress: normalized,
        matchId: data.matchId,
        selection: data.selection,
        odds: data.odds,
        stake: data.stake,
        potentialReturn,
        status: "pending",
        betType: data.betType || "single",
        txHash: `0x${Math.random().toString(16).substring(2)}`,
      });

      // Deduct balance
      const newBalance = (user.doodlBalance || 0) - data.stake;
      await db
        .update(users)
        .set({
          doodlBalance: newBalance,
          totalBets: (user.totalBets || 0) + 1,
        })
        .where(eq(users.walletAddress, normalized));

      // Log transaction
      await db.insert(transactions).values({
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        walletAddress: normalized,
        type: "bet",
        amount: -data.stake,
        currency: "kor",
        description: `Bet on ${data.selection} @ ${data.odds}`,
      });

      return {
        success: true,
        bet: { id: betId },
        newBalance,
      };
    } catch (error: any) {
      console.error("Failed to place bet:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// PLACE ACCUMULATOR BET
// ==========================================

const placeAccumulatorSchema = z.object({
  walletAddress: z.string(),
  selections: z.array(
    z.object({
      matchId: z.string(),
      selection: z.enum(["home", "draw", "away", "gg", "nogg"]),
      odds: z.number(),
    }),
  ),
  stake: z.number().min(1),
  totalOdds: z.number(),
  accumulatorId: z.string(),
});

export const placeAccumulatorBet = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeAccumulatorSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalized),
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Check balance
      if ((user.doodlBalance || 0) < data.stake) {
        return { success: false, error: "Insufficient balance" };
      }

      const potentialReturn = Math.floor(data.stake * data.totalOdds);

      // Create bets for each selection
      const betValues = data.selections.map((sel) => ({
        id: `${data.accumulatorId}-${sel.matchId}`,
        walletAddress: normalized,
        matchId: sel.matchId,
        selection: sel.selection,
        odds: sel.odds,
        stake: data.stake,
        potentialReturn,
        status: "pending",
        betType: "accumulator" as const,
        accumulatorId: data.accumulatorId,
        txHash: `0x${Math.random().toString(16).substring(2)}`,
      }));

      await db.insert(bets).values(betValues);

      // Deduct balance
      const newBalance = (user.doodlBalance || 0) - data.stake;
      await db
        .update(users)
        .set({
          doodlBalance: newBalance,
          totalBets: (user.totalBets || 0) + 1,
        })
        .where(eq(users.walletAddress, normalized));

      // Log transaction
      await db.insert(transactions).values({
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        walletAddress: normalized,
        type: "bet",
        amount: -data.stake,
        currency: "kor",
        description: `Accumulator bet (${data.selections.length} selections) @ ${data.totalOdds.toFixed(2)}`,
      });

      return {
        success: true,
        accumulatorId: data.accumulatorId,
        newBalance,
      };
    } catch (error: any) {
      console.error("Failed to place accumulator:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// SETTLE BETS
// ==========================================

const settleBetsSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
});

export const settleBets = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => settleBetsSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Get all pending bets for this match
      const pendingBets = await db
        .select()
        .from(bets)
        .where(and(eq(bets.matchId, data.matchId), eq(bets.status, "pending")));

      let settled = 0;
      let winners = 0;

      for (const bet of pendingBets) {
        let won = false;

        // Determine winner
        switch (bet.selection) {
          case "home":
            won = data.homeScore > data.awayScore;
            break;
          case "draw":
            won = data.homeScore === data.awayScore;
            break;
          case "away":
            won = data.awayScore > data.homeScore;
            break;
          case "gg":
            won = data.homeScore > 0 && data.awayScore > 0;
            break;
          case "nogg":
            won = data.homeScore === 0 || data.awayScore === 0;
            break;
        }

        const newStatus = won ? "won" : "lost";

        // Update bet status
        await db
          .update(bets)
          .set({
            status: newStatus,
            settledAt: new Date(),
          })
          .where(eq(bets.id, bet.id));

        // If won, credit user
        if (won) {
          winners++;

          // For accumulators, only pay out if all selections won
          if (bet.betType === "accumulator" && bet.accumulatorId) {
            // Check if all selections in accumulator won
            const allBetsInAccumulator = await db
              .select()
              .from(bets)
              .where(eq(bets.accumulatorId, bet.accumulatorId));

            const allSettled = allBetsInAccumulator.every(
              (b) => b.status !== "pending",
            );
            const allWon = allBetsInAccumulator.every(
              (b) => b.status === "won",
            );

            if (allSettled && allWon) {
              // Pay out accumulator - only once per accumulator
              const paidOut = allBetsInAccumulator.some(
                (b) => b.id !== bet.id && b.status === "won",
              );
              if (!paidOut) {
                await db
                  .update(users)
                  .set({
                    doodlBalance: sql`${users.doodlBalance} + ${bet.potentialReturn}`,
                    wins: sql`${users.wins} + 1`,
                  })
                  .where(eq(users.walletAddress, bet.walletAddress));

                // Log win transaction
                await db.insert(transactions).values({
                  id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  walletAddress: bet.walletAddress,
                  type: "win",
                  amount: bet.potentialReturn,
                  currency: "kor",
                  description: `Accumulator win @ ${bet.odds}`,
                });
              }
            }
          } else {
            // Single bet - pay out immediately
            await db
              .update(users)
              .set({
                doodlBalance: sql`${users.doodlBalance} + ${bet.potentialReturn}`,
                wins: sql`${users.wins} + 1`,
              })
              .where(eq(users.walletAddress, bet.walletAddress));

            // Log win transaction
            await db.insert(transactions).values({
              id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              walletAddress: bet.walletAddress,
              type: "win",
              amount: bet.potentialReturn,
              currency: "kor",
              description: `Bet win @ ${bet.odds}`,
            });
          }
        }

        settled++;
      }

      return {
        success: true,
        settled,
        winners,
        total: pendingBets.length,
      };
    } catch (error: any) {
      console.error("Failed to settle bets:", error);
      return { success: false, error: error.message };
    }
  });

// ==========================================
// GET ACTIVE BETS
// ==========================================

const getActiveBetsSchema = z.object({
  walletAddress: z.string(),
});

export const getActiveBets = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getActiveBetsSchema.parse(data))
  .handler(async ({ data }) => {
    const normalized = data.walletAddress.toLowerCase();

    try {
      // Use query builder with joins to get match info
      const userBets = await db
        .select({
          id: bets.id,
          matchId: bets.matchId,
          selection: bets.selection,
          odds: bets.odds,
          stake: bets.stake,
          potentialReturn: bets.potentialReturn,
          status: bets.status,
          createdAt: bets.createdAt,
          txHash: bets.txHash,
          betType: bets.betType,
          accumulatorId: bets.accumulatorId,
          // Match details
          homeTeamId: matches.homeTeamId,
          awayTeamId: matches.awayTeamId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          matchStatus: matches.status,
        })
        .from(bets)
        .leftJoin(matches, eq(bets.matchId, matches.id))
        .where(eq(bets.walletAddress, normalized))
        .orderBy(desc(bets.createdAt));

      // Get all teams for name lookup
      const allTeams = await db.select().from(teams);
      const teamMap = {} as Record<string, string>;
      allTeams.forEach((t) => (teamMap[t.id] = t.name));

      return {
        success: true,
        bets: userBets.map((b) => ({
          ...b,
          homeTeamName: teamMap[b.homeTeamId || ""] || "Unknown",
          awayTeamName: teamMap[b.awayTeamId || ""] || "Unknown",
          timestamp: b.createdAt?.getTime() || Date.now(),
        })),
      };
    } catch (error: any) {
      console.error("Failed to get active bets:", error);
      return { success: false, error: error.message, bets: [] };
    }
  });

// ==========================================
// GET LEAGUE STANDINGS
// ==========================================

const getStandingsSchema = z.object({
  seasonId: z.number().optional(),
});

export const getLeagueStandings = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getStandingsSchema.parse(data || {}))
  .handler(async ({ data }) => {
    try {
      // Get season
      let seasonId = data.seasonId;
      if (!seasonId) {
        const activeSeason = await db.query.seasons.findFirst({
          where: eq(seasons.isActive, true),
          orderBy: desc(seasons.id),
        });
        seasonId = activeSeason?.id || 1;
      }

      // Get all teams
      const allTeams = await db.select().from(teams);

      // Get finished matches for this season
      const finishedMatches = await db
        .select()
        .from(matches)
        .where(
          and(eq(matches.seasonId, seasonId), eq(matches.status, "FINISHED")),
        );

      // Calculate standings
      const standings: Record<
        string,
        {
          teamId: string;
          teamName: string;
          leagueId: string;
          color: string;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goalsFor: number;
          goalsAgainst: number;
          points: number;
        }
      > = {};

      // Initialize all teams
      allTeams.forEach((team) => {
        standings[team.id] = {
          teamId: team.id,
          teamName: team.name,
          leagueId: team.leagueId,
          color: team.color,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
      });

      // Process matches
      finishedMatches.forEach((match) => {
        if (match.homeScore === null || match.awayScore === null) return;

        const home = standings[match.homeTeamId];
        const away = standings[match.awayTeamId];

        if (!home || !away) return;

        home.played++;
        away.played++;

        home.goalsFor += match.homeScore;
        home.goalsAgainst += match.awayScore;
        away.goalsFor += match.awayScore;
        away.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          home.won++;
          home.points += 3;
          away.lost++;
        } else if (match.awayScore > match.homeScore) {
          away.won++;
          away.points += 3;
          home.lost++;
        } else {
          home.drawn++;
          away.drawn++;
          home.points++;
          away.points++;
        }
      });

      // Convert to array and sort
      const standingsArray = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });

      return {
        success: true,
        standings: standingsArray,
        seasonId,
      };
    } catch (error: any) {
      console.error("Failed to get standings:", error);
      return { success: false, error: error.message, standings: [] };
    }
  });
