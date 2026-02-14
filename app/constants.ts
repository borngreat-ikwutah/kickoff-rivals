import { Team, DailyQuest } from "./types";

export const LEAGUES = [
  {
    id: "l1",
    name: "Rivals Premier",
    color: "bg-purple-100 border-purple-300",
  },
  { id: "l2", name: "Elite LaLiga", color: "bg-yellow-100 border-yellow-300" },
  { id: "l3", name: "Prime Serie A", color: "bg-green-100 border-green-300" },
];

export const TEAMS: Record<string, Team[]> = {
  l1: [
    {
      id: "t1",
      name: "Rivals Utd",
      strength: 88,
      leagueId: "l1",
      color: "#ef4444",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Rivals%20Utd",
    }, // Red
    {
      id: "t2",
      name: "KOR City",
      strength: 90,
      leagueId: "l1",
      color: "#0ea5e9",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=KOR%20City",
    }, // Sky Blue
    {
      id: "t3",
      name: "Elite FC",
      strength: 75,
      leagueId: "l1",
      color: "#111827",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Elite%20FC",
    }, // Dark
    {
      id: "t4",
      name: "Striker Athletic",
      strength: 78,
      leagueId: "l1",
      color: "#f97316",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Striker%20Athletic",
    }, // Orange
    {
      id: "t5",
      name: "Goal Rovers",
      strength: 70,
      leagueId: "l1",
      color: "#22c55e",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Goal%20Rovers",
    }, // Green
    {
      id: "t6",
      name: "Pitch Hotspur",
      strength: 82,
      leagueId: "l1",
      color: "#1e3a8a",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Pitch%20Hotspur",
    }, // Navy
    {
      id: "t19",
      name: "Vector Chelsea",
      strength: 84,
      leagueId: "l1",
      color: "#2563eb",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Vector%20Chelsea",
    }, // Blue
    {
      id: "t20",
      name: "Villa Vibe",
      strength: 79,
      leagueId: "l1",
      color: "#7f1d1d",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Villa%20Vibe",
    }, // Claret
    {
      id: "t21",
      name: "Newcastle Net",
      strength: 81,
      leagueId: "l1",
      color: "#000000",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Newcastle%20Net",
    }, // Black
    {
      id: "t22",
      name: "Brighton Ballers",
      strength: 76,
      leagueId: "l1",
      color: "#2dd4bf",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Brighton%20Ballers",
    }, // Teal
    {
      id: "t23",
      name: "West Ham Win",
      strength: 74,
      leagueId: "l1",
      color: "#9f1239",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=West%20Ham%20Win",
    }, // Maroon
    {
      id: "t24",
      name: "Everton Edge",
      strength: 72,
      leagueId: "l1",
      color: "#1d4ed8",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Everton%20Edge",
    }, // Royal Blue
  ],
  l2: [
    {
      id: "t7",
      name: "Real Rivals",
      strength: 92,
      leagueId: "l2",
      color: "#eab308",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Real%20Rivals",
    }, // Gold
    {
      id: "t8",
      name: "Barca Bold",
      strength: 89,
      leagueId: "l2",
      color: "#be185d",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Barca%20Bold",
    }, // Pink/Red
    {
      id: "t9",
      name: "Atletico Ace",
      strength: 80,
      leagueId: "l2",
      color: "#ef4444",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Atletico%20Ace",
    }, // Red
    {
      id: "t10",
      name: "Sevilla Striker",
      strength: 76,
      leagueId: "l2",
      color: "#dc2626",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Sevilla%20Striker",
    }, // Red
    {
      id: "t11",
      name: "Valencia Victory",
      strength: 74,
      leagueId: "l2",
      color: "#f97316",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Valencia%20Victory",
    }, // Orange
    {
      id: "t12",
      name: "Villarreal Vision",
      strength: 72,
      leagueId: "l2",
      color: "#facc15",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Villarreal%20Vision",
    }, // Yellow
    {
      id: "t25",
      name: "Betis Brave",
      strength: 77,
      leagueId: "l2",
      color: "#16a34a",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Betis%20Brave",
    }, // Green
    {
      id: "t26",
      name: "Sociedad Sharp",
      strength: 78,
      leagueId: "l2",
      color: "#3b82f6",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Sociedad%20Sharp",
    }, // Blue
    {
      id: "t27",
      name: "Bilbao Blast",
      strength: 75,
      leagueId: "l2",
      color: "#dc2626",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Bilbao%20Blast",
    }, // Red
    {
      id: "t28",
      name: "Getafe Glory",
      strength: 70,
      leagueId: "l2",
      color: "#2563eb",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Getafe%20Glory",
    }, // Blue
    {
      id: "t29",
      name: "Celta Champion",
      strength: 71,
      leagueId: "l2",
      color: "#60a5fa",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Celta%20Champion",
    }, // Light Blue
    {
      id: "t30",
      name: "Mallorca Master",
      strength: 69,
      leagueId: "l2",
      color: "#b91c1c",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Mallorca%20Master",
    }, // Red
  ],
  l3: [
    {
      id: "t13",
      name: "Juve Jet",
      strength: 85,
      leagueId: "l3",
      color: "#000000",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Juve%20Jet",
    }, // Black
    {
      id: "t14",
      name: "Milan Master",
      strength: 84,
      leagueId: "l3",
      color: "#b91c1c",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Milan%20Master",
    }, // Red
    {
      id: "t15",
      name: "Inter Icon",
      strength: 86,
      leagueId: "l3",
      color: "#1e3a8a",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Inter%20Icon",
    }, // Blue
    {
      id: "t16",
      name: "Roma Royal",
      strength: 77,
      leagueId: "l3",
      color: "#9f1239",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Roma%20Royal",
    }, // Maroon
    {
      id: "t17",
      name: "Napoli Noble",
      strength: 81,
      leagueId: "l3",
      color: "#0ea5e9",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Napoli%20Noble",
    }, // Sky Blue
    {
      id: "t18",
      name: "Lazio Legend",
      strength: 73,
      leagueId: "l3",
      color: "#06b6d4",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Lazio%20Legend",
    }, // Cyan
    {
      id: "t31",
      name: "Atalanta Ace",
      strength: 79,
      leagueId: "l3",
      color: "#1e40af",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Atalanta%20Ace",
    }, // Blue
    {
      id: "t32",
      name: "Fiorentina Flash",
      strength: 76,
      leagueId: "l3",
      color: "#7e22ce",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Fiorentina%20Flash",
    }, // Purple
    {
      id: "t33",
      name: "Torino Titan",
      strength: 72,
      leagueId: "l3",
      color: "#991b1b",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Torino%20Titan",
    }, // Dark Red
    {
      id: "t34",
      name: "Bologna Bold",
      strength: 74,
      leagueId: "l3",
      color: "#be123c",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Bologna%20Bold",
    }, // Red
    {
      id: "t35",
      name: "Monza Major",
      strength: 70,
      leagueId: "l3",
      color: "#dc2626",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Monza%20Major",
    }, // Red
    {
      id: "t36",
      name: "Sassuolo Star",
      strength: 71,
      leagueId: "l3",
      color: "#15803d",
      logo: "https://api.dicebear.com/9.x/shapes/svg?seed=Sassuolo%20Star",
    }, // Green
  ],
};

export const INITIAL_BALANCE = 1000;
export const ROUND_DURATION_SEC = 240; // 4 minutes
export const MATCH_DURATION_SEC = 120; // 2 minutes
export const RESULT_DURATION_SEC = 240; // 4 minutes

export const CONVERSION_RATE = 1000; // 1000 Coins = 100 Tokens
export const CONVERSION_YIELD = 100;

// Fix: Added required 'status' property to the initial quests
export const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: "q1",
    title: "Follow @kickoffrivals",
    reward: 200,
    type: "click",
    frequency: "daily",
    target: 1,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
  {
    id: "q2",
    title: "Play 5 games",
    reward: 100,
    type: "play",
    frequency: "daily",
    target: 5,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
  {
    id: "q3",
    title: "Win 5 matches",
    reward: 500,
    type: "win",
    frequency: "daily",
    target: 5,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
  {
    id: "q4",
    title: "High Roller: Wager 1000",
    reward: 300,
    type: "bet",
    frequency: "daily",
    target: 1000,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
  {
    id: "w1",
    title: "Weekly Warrior: 50 Games",
    reward: 2000,
    type: "play",
    frequency: "weekly",
    target: 50,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
  {
    id: "w2",
    title: "Elite Punter: 20 Wins",
    reward: 5000,
    type: "win",
    frequency: "weekly",
    target: 20,
    progress: 0,
    completed: false,
    status: "LIVE",
  },
];
