
import { db, matches, seasons } from "../app/lib/db";
import { eq, desc } from "drizzle-orm";

async function main() {
  console.log("Checking Seasons...");
  const seasonList = await db.select().from(seasons);
  console.log("Seasons:", seasonList);

  const activeSeason = seasonList.find(s => s.isActive);
  if (!activeSeason) {
      console.log("No active season found!");
  } else {
      console.log("Active Season:", activeSeason.id);
  }

  console.log("\nChecking Matches...");
  const matchesList = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(10);
  console.log(`Found ${matchesList.length} matches (showing last 10).`);
  
  for (const m of matchesList) {
      console.log(`Match ${m.id}: Season=${m.seasonId}, Round=${m.round}, Status=${m.status}, Score=${m.homeScore}-${m.awayScore}`);
  }
}

main().catch(console.error);
