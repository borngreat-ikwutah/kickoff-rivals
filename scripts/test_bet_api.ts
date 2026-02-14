
import { db, users, matches } from "../app/lib/db";
import { eq, desc } from "drizzle-orm";

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
        console.log("Using match:", match.id);
        matchId = match.id;
    } else {
        console.log("No SCHEDULED match found. Unable to test.");
        return;
    }

    const payload = {
        walletAddress: user.walletAddress,
        matchId: match.id,
        selection: "home",
        stake: 10,
        odds: 2.0,
        betType: "single"
    };

    console.log("Sending POST to /api/minigame/bet...", payload);
    try {
        const res = await fetch("http://localhost:3000/api/minigame/bet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Data:", data);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

main().catch(console.error);
