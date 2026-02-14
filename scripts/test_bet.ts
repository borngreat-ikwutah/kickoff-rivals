
import { db, users, matches } from "../app/lib/db";
import { placeBet } from "../app/server/matches";
import { eq, desc, and } from "drizzle-orm";

async function main() {
    console.log("Finding user...");
    const user = await db.query.users.findFirst();
    if (!user) {
        console.error("No user found!");
        return;
    }
    console.log("User:", user.walletAddress, "Balance:", user.doodlBalance);

    let matchId = "";

    console.log("Finding active match...");
    const match = await db.query.matches.findFirst({
        where: eq(matches.status, 'SCHEDULED'),
        orderBy: desc(matches.startTime)
    });

    if (match) {
        console.log("Using existing match:", match.id);
        matchId = match.id;
    } else {
        console.log("No SCHEDULED match found. Creating Fake Match...");
        const fakeId = `fake-${Date.now()}`;
        try {
            await db.insert(matches).values({
                id: fakeId,
                leagueId: 'l1',
                seasonId: 1, // Assume 1 exists
                round: 999,
                homeTeamId: 't1',
                awayTeamId: 't2',
                status: 'SCHEDULED',
                startTime: new Date(Date.now() + 60000), // Starts in 1 min
                oddsHome: 2.0,
                oddsDraw: 3.0,
                oddsAway: 2.5,
                oddsGg: 1.8,
                oddsNogg: 1.9,
                roundHash: 'test',
                commitHash: 'test',
            });
            console.log("Created fake match:", fakeId);
            matchId = fakeId;
        } catch (e) {
            console.error("Failed to create fake match:", e);
            return;
        }
    }

    await doBet(user.walletAddress, matchId);
}

async function doBet(walletAddress: string, matchId: string) {
    const payload = {
        data: {
          walletAddress,
          matchId,
          selection: "home",
          stake: 10,
          odds: 2.0,
          betType: "single"
        }
    };

    console.log("Placing bet...", payload);
    try {
        const result = await placeBet(payload as any);
        console.log("Result:", result);
    } catch (e) {
        console.error("placeBet threw error:", e);
    }
}

main().catch(console.error);
