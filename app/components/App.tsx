import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  TEAMS,
  INITIAL_BALANCE,
  LEAGUES,
  ROUND_DURATION_SEC,
  MATCH_DURATION_SEC,
  RESULT_DURATION_SEC,
  INITIAL_QUESTS,
  CONVERSION_RATE,
  CONVERSION_YIELD,
} from "../constants";
import {
  Match,
  MatchResult, // Added import
  Bet,
  LeagueEntry,
  Transaction,
  UserStats,
  GameState,
  SeasonArchive,
  AppTheme,
  Coupon,
  DailyQuest,
  WalletState,
  BetSlipSelection,
} from "../types";
import { MatchCard } from "./MatchCard";
import { generateMatchResult, calculateOdds } from "../services/matchService";
import { SimulationScreen } from "./SimulationScreen";
import { LeagueTable } from "./LeagueTable";
import { ProfileScreen } from "./ProfileScreen";
import { WalletModal } from "./WalletModal";
import { IconHome, IconTicket, IconUser, IconTable } from "./Icons";
import { ConnectWallet } from "./ConnectWallet";
import { SwapConfirm } from "./SwapConfirm";
import { BetModal } from "./BetModal";
import { BetSlip } from "./BetSlip";
import { RivalsLogo } from "./RivalsLogo";
import { Onboarding } from "./Onboarding";
const AdminPortal = lazy(() =>
  import("./AdminPortal").then((mod) => ({ default: mod.AdminPortal })),
);
import { AdminAuth } from "./AdminAuth";
import { SignMessage } from "./SignMessage";
import { WelcomeScreen } from "./WelcomeScreen";
import {
  hasValidAdminSession,
  getSessionToken,
  logoutAdmin,
  clearSessionToken,
} from "../services/adminAuthService";
import { verifyCoupon } from "../services/couponService";
import { LandingPage } from "./LandingPage";
import { GameSelection } from "./GameSelection";
import { AllianceSetup } from "./AllianceSetup";
import { EntryChoice } from "./EntryChoice";

// Session token management - no admin wallet exposed
let adminSessionToken: string | null = null;

// API URL - empty string for same-origin requests in TanStack Start
const API_URL = "";

const generateHash = () =>
  "0x" +
  Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

const generate6DigitCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const App: React.FC = () => {
  // Enhanced Entry Flow: landing -> selection -> entryChoice -> onboarding/alliance -> connect -> sign -> welcome -> main
  const [appView, setAppView] = useState<
    | "landing"
    | "selection"
    | "entryChoice"
    | "onboarding"
    | "alliance"
    | "connect"
    | "sign"
    | "welcome"
    | "main"
  >(() => {
    // If they've already connected before, we still show the selection screen for a platform feel
    // but skipping the landing page.
    if (localStorage.getItem("onboarding_complete") === "true") {
      return "selection";
    }
    return "landing";
  });

  // Alliance Registration State
  const [registrationData, setRegistrationData] = useState<{
    username: string;
    leagueId: string;
    teamId: string;
  } | null>(null);
  const [gameState, setGameState] = useState<GameState>("BETTING");
  const [timer, setTimer] = useState(ROUND_DURATION_SEC);
  const [roundNumber, setRoundNumber] = useState(1);
  const [seasonId, setSeasonId] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "home" | "league" | "bets" | "profile"
  >("home");
  const [betTab, setBetTab] = useState<"ongoing" | "ended">("ongoing");
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [showWallet, setShowWallet] = useState(false);
  // Mystery box removed
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  const [bettingOn, setBettingOn] = useState<Match | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminSessionValid, setAdminSessionValid] = useState(false);
  const [themeTransition, setThemeTransition] = useState(false);
  const [betSlipSelections, setBetSlipSelections] = useState<
    BetSlipSelection[]
  >([]);
  const [debugStatus, setDebugStatus] = useState<string>("Init");
  const [isNewUser, setIsNewUser] = useState(true);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    isVerified: false,
    verificationSignature: null,
    verificationTimestamp: null,
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [leagueTables, setLeagueTables] = useState<
    Record<string, LeagueEntry[]>
  >({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([
    // Empty - coupons are managed server-side now
    // Don't expose coupon codes in frontend!
  ]);

  const serverSeedsRef = useRef<Record<string, string>>({});

  const [userStats, setUserStats] = useState<UserStats>({
    username: "",
    level: 1,
    xp: 0,
    totalBets: 0,
    wins: 0,
    biggestWin: 0,
    walletAddress: "",
    currentStreak: 0,
    longestStreak: 0,
    bestOddsWon: 0,
    dailyWalkPoints: 0,
    lastWalkDate: "",
    coins: 1000,
    korBalance: 1000,
    referralCode: generate6DigitCode(),
    hasReferred: false,
    referralCount: 0,
    referralEarnings: 0,
    loginStreak: 1,
    lastLoginDate: "",
    quests: [...INITIAL_QUESTS],
    activeTheme: "default",
    unclaimedAllianceRewards: 0,
  });

  const [watchingMatchId, setWatchingMatchId] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(LEAGUES[0].id);

  useEffect(() => {
    const tables: Record<string, LeagueEntry[]> = {};
    LEAGUES.forEach((league) => {
      tables[league.id] = TEAMS[league.id].map((team) => ({
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }));
    });
    setLeagueTables(tables);
  }, []);

  // SYNC WITH SERVER STATE
  async function fetchMatches() {
    try {
      const res = await fetch(`${API_URL}/api/matches/current`); // Fetch ALL leagues
      const data = await res.json();

      if (data.success && data.matches && data.matches.length > 0) {
        const serverMatches = data.matches.map((m: any) => {
          const lId = m.leagueId || m.league_id || "l1";
          const teamList = TEAMS[lId] || TEAMS["l1"];

          // Prefer server-provided names, fallback to local lookup
          const hTeam = m.home_team_name
            ? {
              id: m.home_team_id,
              name: m.home_team_name,
              color: "#000",
              strength: 50,
              leagueId: lId,
            }
            : teamList.find((t) => t.id === m.home_team_id) || {
              id: "unknown",
              name: "Unknown",
              color: "#000",
              strength: 50,
              leagueId: lId,
            };

          const aTeam = m.away_team_name
            ? {
              id: m.away_team_id,
              name: m.away_team_name,
              color: "#000",
              strength: 50,
              leagueId: lId,
            }
            : teamList.find((t) => t.id === m.away_team_id) || {
              id: "unknown",
              name: "Unknown",
              color: "#000",
              strength: 50,
              leagueId: lId,
            };

          return {
            id: m.id,
            leagueId: lId,
            seasonId: m.seasonId || m.season_id,
            round: m.round || m.round_number,
            homeTeam: hTeam,
            awayTeam: aTeam,
            startTime: new Date(m.scheduled_time).getTime(),
            status: m.status.toUpperCase(),
            homeScore: m.homeScore, // Usually final or live static score from DB
            awayScore: m.awayScore,
            // Calculate current display score if LIVE
            currentScore: m.status.toUpperCase() === 'LIVE' ? { home: m.homeScore, away: m.awayScore } : undefined,
            odds: m.odds || {
              home: 2.0,
              draw: 3.0,
              away: 2.0,
              gg: 1.75,
              nogg: 2.1,
            },
            roundHash: m.round_hash || "",
            commitHash: m.commit_hash || "",
            liveStartTime: m.live_start_time ? new Date(m.live_start_time).getTime() : undefined,
            events: m.events,
            result: (m.homeScore !== null && m.awayScore !== null) ? { homeScore: m.homeScore, awayScore: m.awayScore, events: m.events || [] } : undefined
          };
        });

        setMatches(serverMatches);

        // Update Global State from the first match found
        if (serverMatches.length > 0) {
          const first = serverMatches[0];
          const sId = Number(first.seasonId) || 1;
          const rNum = Number(first.round) || 1;

          setSeasonId(sId);
          setRoundNumber(rNum);
          fetchStandings(sId);
        }
      } else {
        // Fallback if server empty
        generateRoundMatches(1, 1, generateHash());
        fetchStandings(1);
      }
    } catch (e) {
      console.error("Sync failed, falling back", e);
      generateRoundMatches(1, 1, generateHash());
    }
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (appView !== "main") return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleStateTransition();
          return 0;
        }
        return prev - 1;
      });
      if (gameState === "LIVE") updateLiveScores();
    }, 1000);
    return () => clearInterval(interval);
  }, [appView, gameState, timer]);

  async function refreshProfile(address: string) {
    let data: any = null;
    try {
      // Include alliance data if we are in registration phase
      let url = `${API_URL}/api/user/profile?walletAddress=${address}`;
      if (registrationData) {
        const { username, leagueId, teamId } = registrationData;
        url += `&username=${encodeURIComponent(username)}&leagueId=${encodeURIComponent(leagueId)}&teamId=${encodeURIComponent(teamId)}`;
      }

      // Fetch profile from Backend (Supabase)
      const res = await fetch(url);
      data = await res.json();

      if (data && data.success) {
        // Clear registration data once synced
        setRegistrationData(null);
        const userData = data.user || data;

        setDebugStatus(`OK: ${userData.username}`);
        setIsNewUser(false);
        setUserStats((prev) => ({
          ...prev,
          walletAddress: address,
          username: userData.username || prev.username,
          coins: Number(userData.coins) || 0,
          korBalance: Number(userData.korBalance) || 1000,
          referralEarnings: userData.referralEarnings || 0,
          unclaimedAllianceRewards:
            Number(userData.unclaimedAllianceRewards) || 0,
          allianceLeagueId: userData.allianceLeagueId,
          allianceTeamId: userData.allianceTeamId,
        }));
        setBalance(Number(userData.korBalance) || 1000);
      } else {
        // Fallback for failed profile fetch - don't block the user
        console.warn(
          "Profile fetch failed or returned unsuccessful, using defaults/state",
        );
        setDebugStatus(`FALLBACK: ${address.slice(0, 6)}`);
        setUserStats((prev) => ({
          ...prev,
          walletAddress: address,
          username:
            prev.username || `Rival_${address.slice(2, 6).toUpperCase()}`,
        }));
      }
    } catch (err: any) {
      setDebugStatus(`ERR: ${err.message}`);
      console.error("Failed to sync profile", err);
      // Ensure address is set even on network error
      setUserStats((prev) => ({ ...prev, walletAddress: address }));
    }

    // Always proceed to next view if we have an address
    if (address) {
      const isVerified = localStorage.getItem(`verified_${address}`) === "true";
      if (isVerified) {
        setWalletState((prev) => ({
          ...prev,
          isVerified: true,
          verificationTimestamp: Date.now(),
        }));
        setAppView("main");
      } else {
        setAppView("sign");
      }
    }
  };

  function handleStateTransition() {
    if (gameState === "BETTING") {
      setGameState("LIVE");
      setTimer(MATCH_DURATION_SEC);
      setMatches((prev) =>
        prev.map((m) => {
          const seed = serverSeedsRef.current[m.id] || generateHash();
          const blockHash = generateHash();
          return {
            ...m,
            status: "LIVE",
            liveStartTime: Date.now(), // Track when match went live for 10-second betting window
            blockHash,
            result: generateMatchResult(
              { ...m, blockHash },
              seed,
            ),
            currentScore: { home: 0, away: 0 },
          };
        }),
      );
    } else if (gameState === "LIVE") {
      setGameState("RESULT");
      setTimer(RESULT_DURATION_SEC);
      processResults();
      // IMMEDIATE REFRESH: Fetch updated balance (winnings) right after game ends
      if (walletState.isConnected && walletState.address) {
        setTimeout(() => refreshProfile(walletState.address!), 2000); // Small delay to let backend process
      }
    } else if (gameState === "RESULT") {
      const nextRound = roundNumber >= 38 ? 1 : roundNumber + 1;
      const nextSeason = roundNumber >= 38 ? seasonId + 1 : seasonId;
      setGameState("BETTING");
      setTimer(ROUND_DURATION_SEC);
      setRoundNumber(nextRound);
      setSeasonId(nextSeason);
      generateRoundMatches(nextRound, nextSeason, generateHash());
    }
  };

  async function generateRoundMatches(
    round: number,
    sId: number,
    clientSeed: string,
  ) {
    const newMatches: Match[] = [];
    LEAGUES.forEach((league) => {
      const shuffled = [...TEAMS[league.id]].sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length; i += 2) {
        const mId = `m-${league.id}-${sId}-${round}-${i}`;
        const serverSeed = generateHash();
        serverSeedsRef.current[mId] = serverSeed;
        newMatches.push({
          id: mId,
          leagueId: league.id,
          homeTeam: shuffled[i],
          awayTeam: shuffled[i + 1],
          status: "SCHEDULED",
          startTime: Date.now(),
          odds: calculateOdds(shuffled[i].strength, shuffled[i + 1].strength),
          roundHash: clientSeed,
          commitHash: generateHash(),
          seasonId: sId,
          round: round,
        });
      }
    });
    setMatches(newMatches);

    // Save matches to database
    try {
      await fetch(`${API_URL}/api/matches/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches: newMatches }),
      });
      console.log(`[MATCHES] Saved ${newMatches.length} matches to database`);
    } catch (err) {
      console.error("Failed to save matches:", err);
    }
  };

  function updateLiveScores() {
    const progress = (MATCH_DURATION_SEC - timer) / MATCH_DURATION_SEC;
    const currentMin = Math.floor(progress * 90);
    setMatches((prev) =>
      prev.map((m) => {
        if (!m.result && !m.events) return m;

        const events = m.result?.events || m.events || [];

        let h = 0,
          a = 0;
        events.forEach((e) => {
          if (e.minute <= currentMin && e.type === "goal") {
            const teamId = e.teamId || ((e as any).side === 'home' ? m.homeTeam.id : m.awayTeam.id);
            if (teamId === m.homeTeam.id) h++;
            else a++;
          }
        });
        return { ...m, currentScore: { home: h, away: a } };
      }),
    );
  };

  async function processResults() {
    const finishedMatches = matches.map((m) => {
      // If match has result from local simulation, use it
      if (m.result) {
        return {
          ...m,
          status: "FINISHED" as const,
          currentScore: { home: m.result.homeScore, away: m.result.awayScore },
        };
      }
      // If match has scores from server (fetched as live/finished), use them
      if (m.homeScore !== undefined && m.awayScore !== undefined) {
        const pseudoResult: MatchResult = {
          homeScore: m.homeScore!,
          awayScore: m.awayScore!,
          events: m.events || [],
          summary: "Match finished"
        };
        return {
          ...m,
          status: "FINISHED" as const,
          result: pseudoResult,
          currentScore: { home: m.homeScore!, away: m.awayScore! }
        };
      }
      return { ...m, status: "FINISHED" as const };
    });
    setMatches(finishedMatches);

    // Sync all match results to database and settle bets
    for (const match of finishedMatches) {
      if (!match.result) continue;

      try {
        // 1. Update match result in database
        console.log(
          `[SYNC] Updating match ${match.id} score: ${match.result.homeScore}-${match.result.awayScore}`,
        );
        await fetch(`${API_URL}/api/matches/update-result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.id,
            homeScore: match.result.homeScore,
            awayScore: match.result.awayScore,
            events: match.result.events,
            status: "finished",
          }),
        });

        // 2. Settle all bets for this match
        const settleRes = await fetch(`${API_URL}/api/bets/settle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.id,
            homeScore: match.result.homeScore,
            awayScore: match.result.awayScore,
          }),
        });

        const settleData = await settleRes.json();
        console.log(
          `[SETTLEMENT] Match ${match.id}: ${settleData.settled}/${settleData.total} bets settled`,
        );
      } catch (err) {
        console.error(`Failed to process match ${match.id}:`, err);
      }
    }

    // 3. Refresh user balance from database (winners will have updated balance)
    try {
      const profileRes = await fetch(
        `${API_URL}/api/user/profile?walletAddress=${userStats.walletAddress}`,
      );
      const profileData = await profileRes.json();

      if (profileData.success && profileData.user) {
        const newBalance = Number(profileData.user.korBalance) || 0;
        const oldBalance = balance;
        const winnings = newBalance - oldBalance;

        setBalance(newBalance);
        setUserStats((prev) => ({ ...prev, korBalance: newBalance }));

        if (winnings > 0) {
          console.log(`[WINNINGS] You won ${winnings} DOODL!`);
          addTransaction("win", winnings, "kor", "Match Winnings");
        }
      }
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }

    // 4. Fetch updated bets from database to show win/loss status
    try {
      const betsRes = await fetch(
        `${API_URL}/api/bets/active?walletAddress=${userStats.walletAddress}`,
      );
      const betsData = await betsRes.json();

      if (betsData.success) {
        // Transform DB bets to frontend format
        const dbBets = betsData.bets.map((b: any) => ({
          id: b.id,
          matchId: b.match_id,
          selection: b.selection,
          odds: Number(b.odds),
          stake: Number(b.stake),
          potentialReturn: Number(b.potential_return),
          status: b.status,
          timestamp: new Date(b.placed_at).getTime(),
          txHash: b.tx_hash || generateHash(),
        }));

        setActiveBets(dbBets);
      }
    } catch (err) {
      console.error("Failed to fetch bets:", err);
    }

    // 5. Refresh standings from database
    fetchStandings();
  }

  async function fetchStandings(overrideSeasonId?: number) {
    try {
      const sid = overrideSeasonId || seasonId || 1;
      console.log(`[STANDINGS] Fetching for Season ID: ${sid}`);
      const res = await fetch(
        `${API_URL}/api/leagues/standings?seasonId=${sid}`,
      );
      const data = await res.json();
      console.log("[STANDINGS] Received:", data);

      if (data.success && data.standings) {
        const tables: Record<string, LeagueEntry[]> = {};
        LEAGUES.forEach((league) => {
          const leagueStandings = data.standings.filter(
            (s: any) => s.leagueId === league.id,
          );
          tables[league.id] = leagueStandings.map((s: any) => ({
            teamId: s.teamId,
            teamName: s.teamName,
            color: s.color,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
          }));

          // Add missing teams if any
          TEAMS[league.id].forEach((team) => {
            if (!tables[league.id].find((e) => e.teamId === team.id)) {
              tables[league.id].push({
                teamId: team.id,
                teamName: team.name,
                color: team.color,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
              });
            }
          });

          // Sort by points, then goal difference
          tables[league.id].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
          });
        });
        setLeagueTables(tables);
      }
    } catch (err) {
      console.error("Failed to fetch standings:", err);
    }
  };

  function addTransaction(
    type: Transaction["type"],
    amount: number,
    currency: "kor" | "coins",
    description: string,
  ) {
    setTransactions((prev) => [
      ...prev,
      {
        id: `tx-${Date.now()}`,
        type,
        amount,
        currency,
        description,
        timestamp: Date.now(),
        hash: generateHash(),
      },
    ]);
  }

  function handleWalletConnected(address: string) {
    setWalletState((prev) => ({ ...prev, address, isConnected: true }));
    refreshProfile(address);
  }

  function handleMessageSigned() {
    // Mark wallet as verified with timestamp
    setWalletState((prev) => ({
      ...prev,
      isVerified: true,
      verificationTimestamp: Date.now(),
    }));

    // Persist verification status for this wallet
    if (walletState.address) {
      localStorage.setItem(`verified_${walletState.address}`, "true");
    }

    setAppView("welcome");
  }

  // Check for existing admin session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const hasSession = await hasValidAdminSession();
      if (hasSession) {
        adminSessionToken = getSessionToken();
        setAdminSessionValid(true);
        setShowAdmin(true);
      }
    };
    checkExistingSession();
  }, []);

  function handleAdminSyncRequest() {
    setShowAdminAuth(true);
  }

  function handleAdminAuthSuccess() {
    // Get token from localStorage (set by AdminAuth component)
    adminSessionToken = getSessionToken();
    setAdminSessionValid(true);
    setShowAdminAuth(false);
    setShowAdmin(true);
  }

  async function handleAdminLogout() {
    if (adminSessionToken) {
      await logoutAdmin(adminSessionToken);
    }
    clearSessionToken();
    adminSessionToken = null;
    setAdminSessionValid(false);
    setShowAdmin(false);
  }

  function handleClaimMysteryBox() {
    // Mystery box removed - no-op
  }

  function handleProceedFromWelcome() {
    localStorage.setItem(`user_${userStats.walletAddress}`, userStats.username);
    localStorage.setItem("onboarding_complete", "true");
    setAppView("main");
  }

  async function handleClaimAllianceRewards() {
    try {
      const res = await fetch(`${API_URL}/api/user/claim-alliance-rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: userStats.walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`SUCCESS! Claimed ${data.claimed} KOR from Alliance matches.`);
        if (userStats.walletAddress) refreshProfile(userStats.walletAddress);
      } else {
        alert(data.error || "Claim failed");
      }
    } catch (e) {
      console.error("Claim error", e);
    }
  }

  function handleLogout() {
    setAppView("connect");
    setActiveTab("home");
    setBalance(INITIAL_BALANCE);
    setActiveBets([]);
    setTransactions([]);
    setUserStats({
      username: "",
      level: 1,
      xp: 0,
      totalBets: 0,
      wins: 0,
      biggestWin: 0,
      walletAddress: "",
      currentStreak: 0,
      longestStreak: 0,
      bestOddsWon: 0,
      dailyWalkPoints: 0,
      lastWalkDate: "",
      coins: 1000,
      korBalance: 1000,
      referralCode: generate6DigitCode(),
      hasReferred: false,
      referralCount: 0,
      referralEarnings: 0,
      loginStreak: 1,
      lastLoginDate: "",
      quests: [...INITIAL_QUESTS],
      activeTheme: "default",
      unclaimedAllianceRewards: 0,
    });

    // Force full reload to ensure clean slate
    window.location.reload();
  }

  // Register referral code with backend
  async function handleReferral(
    code: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!walletState.address)
        return { success: false, message: "Wallet not connected" };
      const res = await fetch(`${API_URL}/api/user/register-referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletState.address,
          referralCode: code,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.warn("Referral failed", json);
        return { success: false, message: json.error || "Failed" };
      } else {
        console.log("Referral registered", json);
        return { success: true, message: "Referral linked!" };
      }
    } catch (err: any) {
      console.error("Referral error", err);
      return { success: false, message: "Connection failed" };
    }
  }

  async function handleBetPlacement(
    match: Match,
    selection: Bet["selection"],
    stake: number,
  ) {
    if (!match) return;
    if (stake > userStats.korBalance) return; // Use userStats which is synced
    if (!match.odds) {
      console.error("Invalid match or odds data:", match);
      return;
    }

    // Call API to place bet
    try {
      const oddValue = match.odds[selection as keyof typeof match.odds] || 1.5;

      const res = await fetch(`${API_URL}/api/minigame/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletState.address || userStats.walletAddress,
          matchId: match.id,
          selection,
          stake,
          odds: oddValue,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setBalance(data.newBalance);
        setUserStats((prev) => ({ ...prev, korBalance: data.newBalance }));

        const bet: Bet = {
          id: data.bet.id,
          matchId: match.id,
          selection,
          odds: oddValue,
          stake,
          potentialReturn: stake * oddValue,
          status: "pending",
          timestamp: Date.now(),
          txHash: generateHash(),
        };
        setActiveBets((prev) => [bet, ...prev]);
        addTransaction("bet", stake, "kor", `Match wager`);

        // Update Quest Progress
        setUserStats((prev) => ({
          ...prev,
          quests: prev.quests.map((q) =>
            q.type === "bet"
              ? { ...q, progress: q.progress + Number(stake) }
              : q,
          ),
        }));
      } else {
        alert("Bet Failed: " + data.error);
      }
    } catch (e) {
      console.error("Bet placement failed", e);
      alert("Failed to place bet");
    }

    setBettingOn(null);
  }



  // Bet Slip Handlers
  function handleAddToBetSlip(
    match: Match,
    selection: "home" | "draw" | "away" | "gg" | "nogg",
    odds: number,
  ) {
    // Check if selection already exists
    const exists = betSlipSelections.some(
      (sel) => sel.matchId === match.id && sel.selection === selection,
    );
    if (exists) {
      // Remove if already selected
      setBetSlipSelections((prev) =>
        prev.filter(
          (sel) => !(sel.matchId === match.id && sel.selection === selection),
        ),
      );
      return;
    }

    // Add new selection
    const newSelection: BetSlipSelection = {
      matchId: match.id,
      match,
      selection,
      odds,
      selectionLabel: selection,
    };
    setBetSlipSelections((prev) => [...prev, newSelection]);
  }

  function handleRemoveFromBetSlip(matchId: string) {
    setBetSlipSelections((prev) =>
      prev.filter((sel) => sel.matchId !== matchId),
    );
  }


  function handleClearBetSlip() {
    setBetSlipSelections([]);
  }

  async function handlePlaceBetSlip(
    stake: number,
    betType: "single" | "accumulator",
  ) {
    if (betSlipSelections.length === 0) return;

    try {
      if (betType === "single") {
        // Place each selection as a separate bet
        for (const sel of betSlipSelections) {
          const oddValue = sel.odds;
          const res = await fetch(`${API_URL}/api/minigame/bet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: walletState.address || userStats.walletAddress,
              matchId: sel.matchId,
              selection: sel.selection,
              stake,
              odds: oddValue,
              betType: "single",
            }),
          });
          const data = await res.json();
          if (data.success) {
            const newBet: Bet = {
              id: data.betId || `bet-${Date.now()}-${Math.random()}`,
              matchId: sel.matchId,
              selection: sel.selection,
              odds: oddValue,
              stake,
              potentialReturn: stake * oddValue,
              status: "pending",
              timestamp: Date.now(),
              txHash: generateHash(),
              betType: "single",
            };
            setActiveBets((prev) => [...prev, newBet]);
          }
        }

        const totalStake = stake * betSlipSelections.length;
        setUserStats((s) => ({
          ...s,
          korBalance: s.korBalance - totalStake,
          totalBets: s.totalBets + betSlipSelections.length,
        }));
        setBalance((prev) => prev - totalStake);
        addTransaction(
          "bet",
          totalStake,
          "kor",
          `${betSlipSelections.length} single bets`,
        );
      } else {
        // Place accumulator bet
        const accumulatorId = `acc-${Date.now()}`;
        const totalOdds = betSlipSelections.reduce(
          (acc, sel) => acc * sel.odds,
          1,
        );

        const res = await fetch(`${API_URL}/api/minigame/bet-accumulator`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: walletState.address || userStats.walletAddress,
            selections: betSlipSelections.map((sel) => ({
              matchId: sel.matchId,
              selection: sel.selection,
              odds: sel.odds,
            })),
            stake,
            totalOdds,
            accumulatorId,
          }),
        });

        const data = await res.json();
        if (data.success) {
          // Create bet entries for each selection in the accumulator
          betSlipSelections.forEach((sel) => {
            const newBet: Bet = {
              id: `${accumulatorId}-${sel.matchId}`,
              matchId: sel.matchId,
              selection: sel.selection,
              odds: sel.odds,
              stake: stake,
              potentialReturn: stake * totalOdds,
              status: "pending",
              timestamp: Date.now(),
              txHash: generateHash(),
              betType: "accumulator",
              accumulatorId,
            };
            setActiveBets((prev) => [...prev, newBet]);
          });

          setUserStats((s) => ({
            ...s,
            korBalance: s.korBalance - stake,
            totalBets: s.totalBets + 1,
          }));
          setBalance((prev) => prev - stake);
          addTransaction(
            "bet",
            stake,
            "kor",
            `Accumulator (${betSlipSelections.length} selections)`,
          );
        }
      }

      // Clear bet slip after placing
      setBetSlipSelections([]);
    } catch (e) {
      console.error("Bet slip placement failed", e);
      alert("Failed to place bets");
    }
  }

  function handleQuestAction(id: string) {
    const quest = userStats.quests.find((q) => q.id === id);
    if (!quest) return;

    if (quest.category === "social" && quest.externalUrl) {
      window.open(quest.externalUrl, "_blank");
      setUserStats((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === id
            ? {
              ...q,
              status: "VERIFYING",
              verifiedAt: Date.now() + (q.verificationTime || 60000),
            }
            : q,
        ),
      }));
    }
  }

  function handleQuestClaim(id: string) {
    const quest = userStats.quests.find((q) => q.id === id);
    if (!quest || quest.completed) return;

    const isReady =
      quest.category === "social"
        ? quest.status === "VERIFYING" && Date.now() >= (quest.verifiedAt || 0)
        : quest.progress >= quest.target;

    if (isReady) {
      setUserStats((prev) => ({
        ...prev,
        coins: prev.coins + quest.reward,
        quests: prev.quests.map((q) =>
          q.id === id ? { ...q, completed: true } : q,
        ),
      }));
      addTransaction(
        "redeem",
        quest.reward,
        "coins",
        `Quest Reward: ${quest.title}`,
      );
    }
  }

  async function handleRedeem(
    code: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!code || !userStats.walletAddress) {
      return { success: false, message: "Invalid input" };
    }

    try {
      // Verify coupon server-side - codes are hidden on backend
      const result = await verifyCoupon(code, userStats.walletAddress);

      if (!result.success) {
        return { success: false, message: result.error };
      }

      // Apply reward based on type
      if (result.type === "coins" && typeof result.value === "number") {
        setUserStats((prev) => ({
          ...prev,
          coins: prev.coins + (result.value as number),
        }));
        addTransaction("redeem", result.value, "coins", `Coupon: ${code}`);
      } else if (result.type === "theme" && typeof result.value === "string") {
        // Apply theme
        setUserStats((prev) => ({
          ...prev,
          activeTheme: result.value as AppTheme,
        }));
      }

      return { success: true, message: result.message };
    } catch (error: any) {
      console.error("Redeem error:", error);
      return { success: false, message: "Connection failed" };
    }
  }

  function updateUserStatsOnResult(wins: number) {
    setUserStats((prev) => ({
      ...prev,
      wins: prev.wins + wins,
      quests: prev.quests.map((q) => {
        if (q.type === "play") return { ...q, progress: q.progress + 1 };
        if (q.type === "win" && wins > 0)
          return { ...q, progress: q.progress + wins };
        return q;
      }),
    }));
  }

  function getCurrentGameMinute() {
    if (gameState === "BETTING") return 0;
    if (gameState === "RESULT") return 90;
    const progress = (MATCH_DURATION_SEC - timer) / MATCH_DURATION_SEC;
    return Math.max(0, Math.min(90, Math.floor(progress * 90)));
  }

  if (appView === "landing")
    return <LandingPage onEnter={() => setAppView("selection")} />;
  if (appView === "selection")
    return (
      <GameSelection
        onSelectFootball={() => {
          if (walletState.isConnected && walletState.isVerified) {
            setAppView("main");
          } else {
            setAppView("entryChoice");
          }
        }}
      />
    );
  if (appView === "entryChoice")
    return (
      <EntryChoice
        onNewUser={() => setAppView("onboarding")}
        onReturningUser={() => setAppView("connect")}
      />
    );
  if (appView === "onboarding")
    return <Onboarding onFinish={() => setAppView("alliance")} />;
  if (appView === "alliance")
    return (
      <AllianceSetup
        apiUrl={API_URL}
        onComplete={(data) => {
          setRegistrationData(data);
          setAppView("connect");
        }}
      />
    );
  if (appView === "connect")
    return <ConnectWallet onConnected={handleWalletConnected} />;
  if (appView === "sign")
    return (
      <SignMessage
        address={userStats.walletAddress}
        onSigned={handleMessageSigned}
        onCancel={handleLogout}
      />
    );
  if (appView === "welcome")
    return (
      <WelcomeScreen
        username={userStats.username}
        isNew={isNewUser}
        onProceed={handleProceedFromWelcome}
      />
    );

  // DEBUG OVERLAY
  return (
    <div
      className={`min-h-screen font-sans text-dark bg-light flex flex-col ${themeTransition ? "blur-sm" : ""} transition-all`}
    >
      <header className="bg-dark text-white sticky top-0 z-[110] shadow-md">
        <div className="flex justify-between items-center p-3 h-16">
          <div className="font-sport font-black text-2xl italic tracking-tighter text-white">
            KICKOFF<span className="text-pitch">RIVALS</span>
          </div>
        </div>
        {/* Navigation Menu */}
        <nav className="border-t border-gray-700">
          <div className="flex justify-around items-center">
            {[
              {
                id: "home",
                label: "Matches",
                icon: <IconHome className="w-5 h-5" />,
              },
              {
                id: "league",
                label: "Table",
                icon: <IconTable className="w-5 h-5" />,
              },
              {
                id: "bets",
                label: "My Bets",
                icon: <IconTicket className="w-5 h-5" />,
              },
              {
                id: "profile",
                label: "Profile",
                icon: <IconUser className="w-5 h-5" />,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex flex-col items-center flex-1 py-2 transition-all ${activeTab === t.id ? "text-pitch border-b-2 border-pitch" : "text-gray-400 hover:text-white"}`}
              >
                {t.icon}
                <span
                  className={`text-[9px] font-bold uppercase mt-1 ${activeTab === t.id ? "opacity-100" : "opacity-70"}`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {activeTab === "home" && (
        <div className="p-3 max-w-md mx-auto w-full">
          {/* League Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
            {LEAGUES.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeagueId(l.id)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all shadow-sm ${selectedLeagueId === l.id ? "bg-dark text-white ring-1 ring-pitch" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
              >
                {l.name}
              </button>
            ))}
          </div>

          {/* Timer Banner */}
          <div className="bg-gradient-to-r from-brand-dark to-dark rounded-xl p-4 text-center mb-6 shadow-card border-l-4 border-pitch relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 text-6xl font-sport font-black italic -rotate-12 translate-x-2 -translate-y-2">
              LIVE
            </div>
            <h2 className="font-mono text-[10px] uppercase text-brand-light tracking-widest mb-1">
              {gameState} PHASE
            </h2>
            <div className="font-mono text-4xl font-bold text-white tracking-wider tabular-nums">
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
          </div>

          <div className="space-y-4">
            {matches
              .filter((m) => m.leagueId === selectedLeagueId)
              .map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  minute={getCurrentGameMinute()}
                  displayScore={
                    (m.status === 'FINISHED' || m.status === 'RESULT') && m.result
                      ? { home: m.result.homeScore, away: m.result.awayScore }
                      : m.currentScore
                  }
                  onBet={setBettingOn}
                  onWatch={(match) => setWatchingMatchId(match.id)}
                  onAddToBetSlip={handleAddToBetSlip}
                />
              ))}
          </div>
        </div>
      )}

      {activeTab === "league" && (
        <main className="p-3 max-w-md mx-auto w-full">
          <LeagueTable
            entries={leagueTables[selectedLeagueId] || []}
            currentLeagueId={selectedLeagueId}
            onLeagueChange={setSelectedLeagueId}
            userStats={userStats}
          />
        </main>
      )}
      {activeTab === "bets" && (
        <main className="p-3 max-w-md mx-auto w-full space-y-4">
          <div className="flex bg-gray-200 p-1 rounded-xl overflow-hidden shadow-inner">
            <button
              onClick={() => setBetTab("ongoing")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${betTab === "ongoing" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Active
            </button>
            <button
              onClick={() => setBetTab("ended")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${betTab === "ended" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              History
            </button>
          </div>
          <div className="space-y-3">
            {activeBets
              .filter((b) =>
                betTab === "ongoing"
                  ? b.status === "pending"
                  : b.status !== "pending",
              )
              .map((b, i) => (
                <div
                  key={`${b.id}-${i}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 group hover:border-brand/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {b.betType === 'accumulator' ? 'Accumulator Selection' : 'Single Bet'}
                      </div>
                      <div className="font-bold text-dark text-sm">
                        {b.homeTeamName} vs {b.awayTeamName}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(b.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`text-[9px] font-bold uppercase px-2 py-1 rounded border shadow-sm ${b.status === "won"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : b.status === "lost"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                    >
                      {b.status}
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-gray-50">
                    <div>
                      <div className="font-mono text-xs font-bold text-dark">
                        {b.selection.toUpperCase()} <span className="text-gray-300 mx-1">@</span> <span className="text-brand">{b.odds}</span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        Stake: {b.stake} KOR • Return: {b.potentialReturn} KOR
                      </div>
                    </div>
                    {(b.homeScore !== null && b.awayScore !== null) && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Score</div>
                        <div className="font-mono font-bold text-dark bg-gray-50 px-2 py-1 rounded">
                          {b.homeScore} - {b.awayScore}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </main>
      )}
      {activeTab === "profile" && (
        <main className="p-3 max-w-md mx-auto w-full">
          <ProfileScreen
            stats={userStats}
            onLogout={handleLogout}
            onRedeem={handleRedeem}
            onQuestClaim={handleQuestClaim}
            onQuestAction={handleQuestAction}
            onReferral={handleReferral}
            onSystemSync={handleAdminSyncRequest}
            onOpenWallet={() => setShowWallet(true)}
            onClaimAllianceRewards={handleClaimAllianceRewards}
          />
        </main>
      )}

      {showWallet && (
        <WalletModal
          onClose={() => setShowWallet(false)}
          onSwapRequest={() => {
            setShowWallet(false);
            setShowSwapConfirm(true);
          }}
          currentBalance={balance}
          userStats={userStats}
          onWalkReward={() => { }}
        />
      )}
      {showSwapConfirm && (
        <SwapConfirm
          coins={userStats.coins}
          onConfirm={async () => {
            const amount =
              Math.floor(userStats.coins / CONVERSION_RATE) * CONVERSION_RATE;

            // Call API
            try {
              const res = await fetch(`${API_URL}/api/user/convert-coins`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  walletAddress: userStats.walletAddress,
                  amount,
                }),
              });
              const data = await res.json();

              if (data.success) {
                setUserStats((s) => ({
                  ...s,
                  coins: data.coins,
                  korBalance: data.korBalance,
                }));
                setBalance(data.korBalance);
                addTransaction("convert", amount, "coins", "Swapped for KOR");
              } else {
                alert("Swap failed: " + data.error);
              }
            } catch (e) {
              console.error(e);
            }
            setShowSwapConfirm(false);
          }}
          onCancel={() => setShowSwapConfirm(false)}
        />
      )}

      {/* Mystery box removed - no spinner UI */}

      {watchingMatchId && matches.find((m) => m.id === watchingMatchId) && (
        <SimulationScreen
          match={matches.find((m) => m.id === watchingMatchId)!}
          result={matches.find((m) => m.id === watchingMatchId)!.result!}
          currentMinute={getCurrentGameMinute()}
          onFinish={() => setWatchingMatchId(null)}
        />
      )}
      {bettingOn && (
        <BetModal
          match={bettingOn}
          balance={balance}
          onClose={() => setBettingOn(null)}
          onPlaceBet={handleBetPlacement}
        />
      )}
      {showAdminAuth && (
        <AdminAuth
          onAuthSuccess={handleAdminAuthSuccess}
          onCancel={() => setShowAdminAuth(false)}
        />
      )}
      {showAdmin && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[600] flex items-center justify-center">
              Loading admin...
            </div>
          }
        >
          <AdminPortal
            coupons={coupons}
            setCoupons={setCoupons}
            quests={userStats.quests}
            setQuests={(q: DailyQuest[]) =>
              setUserStats((p) => ({ ...p, quests: q }))
            }
            onClose={() => setShowAdmin(false)}
            sessionToken={adminSessionToken || ""}
            matches={matches}
            onRefreshMatches={fetchMatches}
          />
        </Suspense>
      )}

      {/* Bet Slip - Always visible at bottom */}
      {appView === "main" && (
        <BetSlip
          selections={betSlipSelections}
          balance={userStats.korBalance}
          onRemoveSelection={handleRemoveFromBetSlip}
          onClearAll={handleClearBetSlip}
          onPlaceBet={handlePlaceBetSlip}
        />
      )}
    </div>
  );
};

export default App;
