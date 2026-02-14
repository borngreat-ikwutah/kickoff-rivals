
import { db, matches, seasons } from "../app/lib/db";
import { eq, desc, and } from "drizzle-orm";

async function main() {
  console.log("Checking Finished Matches...");
  const finishedList = await db.select().from(matches).where(eq(matches.status, 'FINISHED')).limit(10);
  console.log(`Found ${finishedList.length} FINISHED matches.`);
  if (finishedList.length > 0) {
      console.log("Sample Finished:", finishedList[0]);
  } else {
      console.log("NO FINISHED MATCHES FOUND in the entire database!");
  }

  // Check Round 19
  console.log("\nChecking Round 19 Matches...");
  const r19 = await db.select().from(matches).where(eq(matches.round, 19)).limit(10);
  console.log(`Found ${r19.length} matches for Round 19.`);
  for (const m of r19) {
      console.log(`R19 Match: Status=${m.status}, Score=${m.homeScore}-${m.awayScore}`);
  }
}

main().catch(console.error);
