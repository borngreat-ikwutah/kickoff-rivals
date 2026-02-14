import { db, leagues, teams, seasons } from "./index";

// ==========================================
// LEAGUE DATA
// ==========================================

const LEAGUES_DATA = [
  { id: "l1", name: "Rivals Premier", color: "bg-purple-100 border-purple-300" },
  { id: "l2", name: "Elite LaLiga", color: "bg-yellow-100 border-yellow-300" },
  { id: "l3", name: "Prime Serie A", color: "bg-green-100 border-green-300" },
];

// ==========================================
// TEAMS DATA
// ==========================================

const TEAMS_DATA: Record<string, Array<{ id: string; name: string; strength: number; color: string }>> = {
  l1: [
    { id: "t1", name: "Rivals Utd", strength: 88, color: "#ef4444" },
    { id: "t2", name: "KOR City", strength: 90, color: "#0ea5e9" },
    { id: "t3", name: "Elite FC", strength: 75, color: "#111827" },
    { id: "t4", name: "Striker Athletic", strength: 78, color: "#f97316" },
    { id: "t5", name: "Goal Rovers", strength: 70, color: "#22c55e" },
    { id: "t6", name: "Pitch Hotspur", strength: 82, color: "#1e3a8a" },
    { id: "t19", name: "Vector Chelsea", strength: 84, color: "#2563eb" },
    { id: "t20", name: "Villa Vibe", strength: 79, color: "#7f1d1d" },
    { id: "t21", name: "Newcastle Net", strength: 81, color: "#000000" },
    { id: "t22", name: "Brighton Ballers", strength: 76, color: "#2dd4bf" },
    { id: "t23", name: "West Ham Win", strength: 74, color: "#9f1239" },
    { id: "t24", name: "Everton Edge", strength: 72, color: "#1d4ed8" },
  ],
  l2: [
    { id: "t7", name: "Real Rivals", strength: 92, color: "#eab308" },
    { id: "t8", name: "Barca Bold", strength: 89, color: "#be185d" },
    { id: "t9", name: "Atletico Ace", strength: 80, color: "#ef4444" },
    { id: "t10", name: "Sevilla Striker", strength: 76, color: "#dc2626" },
    { id: "t11", name: "Valencia Victory", strength: 74, color: "#f97316" },
    { id: "t12", name: "Villarreal Vision", strength: 72, color: "#facc15" },
    { id: "t25", name: "Betis Brave", strength: 77, color: "#16a34a" },
    { id: "t26", name: "Sociedad Sharp", strength: 78, color: "#3b82f6" },
    { id: "t27", name: "Bilbao Blast", strength: 75, color: "#dc2626" },
    { id: "t28", name: "Getafe Glory", strength: 70, color: "#2563eb" },
    { id: "t29", name: "Celta Champion", strength: 71, color: "#60a5fa" },
    { id: "t30", name: "Mallorca Master", strength: 69, color: "#b91c1c" },
  ],
  l3: [
    { id: "t13", name: "Juve Jet", strength: 85, color: "#000000" },
    { id: "t14", name: "Milan Master", strength: 84, color: "#b91c1c" },
    { id: "t15", name: "Inter Icon", strength: 86, color: "#1e3a8a" },
    { id: "t16", name: "Roma Royal", strength: 77, color: "#9f1239" },
    { id: "t17", name: "Napoli Noble", strength: 81, color: "#0ea5e9" },
    { id: "t18", name: "Lazio Legend", strength: 73, color: "#06b6d4" },
    { id: "t31", name: "Atalanta Ace", strength: 79, color: "#1e40af" },
    { id: "t32", name: "Fiorentina Flash", strength: 76, color: "#7e22ce" },
    { id: "t33", name: "Torino Titan", strength: 72, color: "#991b1b" },
    { id: "t34", name: "Bologna Bold", strength: 74, color: "#be123c" },
    { id: "t35", name: "Monza Major", strength: 70, color: "#dc2626" },
    { id: "t36", name: "Sassuolo Star", strength: 71, color: "#15803d" },
  ],
};

// ==========================================
// SEED FUNCTION
// ==========================================

export async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Seed Leagues
    console.log("📋 Seeding leagues...");
    for (const league of LEAGUES_DATA) {
      await db
        .insert(leagues)
        .values(league)
        .onConflictDoNothing();
    }
    console.log(`✅ Seeded ${LEAGUES_DATA.length} leagues`);

    // 2. Seed Teams
    console.log("⚽ Seeding teams...");
    let teamCount = 0;
    for (const [leagueId, teamsInLeague] of Object.entries(TEAMS_DATA)) {
      for (const team of teamsInLeague) {
        await db
          .insert(teams)
          .values({
            id: team.id,
            name: team.name,
            leagueId,
            strength: team.strength,
            color: team.color,
          })
          .onConflictDoNothing();
        teamCount++;
      }
    }
    console.log(`✅ Seeded ${teamCount} teams`);

    // 3. Create initial season
    console.log("🏆 Creating initial season...");
    const existingSeason = await db.query.seasons.findFirst({
      where: (seasons, { eq }) => eq(seasons.isActive, true),
    });

    if (!existingSeason) {
      await db.insert(seasons).values({
        isActive: true,
        currentRound: 1,
      });
      console.log("✅ Created Season 1");
    } else {
      console.log(`ℹ️ Active season already exists (ID: ${existingSeason.id})`);
    }

    console.log("🎉 Database seed completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// ==========================================
// RUN SEED DIRECTLY
// ==========================================

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("Seed script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed script failed:", error);
      process.exit(1);
    });
}
