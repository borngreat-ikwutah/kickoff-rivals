
import { db, bets } from "../app/lib/db";
import { eq, desc } from "drizzle-orm";

async function main() {
  console.log("Checking Bets...");
  const allBets = await db.select().from(bets).orderBy(desc(bets.createdAt)).limit(10);
  console.log(`Found ${allBets.length} bets.`);
  allBets.forEach((b) => {
    console.log(`Bet ${b.id}: Wallet=${b.walletAddress}, Status=${b.status}, Match=${b.matchId}, Selection=${b.selection}`);
  });
}

main().catch(console.error).then(() => process.exit(0));
