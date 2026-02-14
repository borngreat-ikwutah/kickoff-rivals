import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
import type {
  Match,
  Bet,
  LeagueEntry,
  Transaction,
  UserStats,
  GameState,
  Coupon,
  DailyQuest,
  WalletState,
  BetSlipSelection,
} from "../types";
import { generateMatchResult, calculateOdds } from "../services/matchService";
import {
  hasValidAdminSession,
  getSessionToken,
  logoutAdmin,
  clearSessionToken,
} from "../services/adminAuthService";

const API_URL = "";

const generateHash = () =>
  "0x" +
  Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

const generate6DigitCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// CONTEXT TYPE
// ==========================================

interface GameContextType {
  // Wallet
  walletState: WalletState;
  setWalletState: React.Dispatch<React.SetStateAction<WalletState>>;

  // User
  userStats: UserStats;
  setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
  isNewUser: boolean;
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean>>;

  // Registration
  registrationData: {
    username: string;
    leagueId: string;
    teamId: string;
  } | null;
  setRegistrationData: React.Dispatch<
    React.SetStateAction<{
      username: string;
      leagueId: string;
      teamId: string;
    } | null>
  >;

  // Balance
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;

  // Game State
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  timer: number;
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  roundNumber: number;
  setRoundNumber: React.Dispatch<React.SetStateAction<number>>;
  seasonId: number;
  setSeasonId: React.Dispatch<React.SetStateAction<number>>;

  // Matches
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;

  // Bets
  activeBets: Bet[];
  setActiveBets: React.Dispatch<React.SetStateAction<Bet[]>>;
  betSlipSelections: BetSlipSelection[];
  setBetSlipSelections: React.Dispatch<
    React.SetStateAction<BetSlipSelection[]>
  >;

  // League Tables
  leagueTables: Record<string, LeagueEntry[]>;
  setLeagueTables: React.Dispatch<
    React.SetStateAction<Record<string, LeagueEntry[]>>
  >;

  // Transactions
  transactions: Transaction[];
  addTransaction: (
    type: Transaction["type"],
    amount: number,
    currency: "kor" | "coins",
    description: string,
  ) => void;

  // Coupons
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;

  // Handlers
  handleWalletConnected: (address: string) => void;
  handleMessageSigned: () => void;
  handleProceedFromWelcome: () => void;
  handleLogout: () => void;
  refreshProfile: (address: string) => Promise<void>;
  handleBetPlacement: (
    match: Match,
    selection: Bet["selection"],
    stake: number,
  ) => Promise<boolean>;
  handleAddToBetSlip: (
    match: Match,
    selection: "home" | "draw" | "away" | "gg" | "nogg",
    odds: number,
  ) => void;
  handleRemoveFromBetSlip: (matchId: string) => void;
  handleClearBetSlip: () => void;
  handlePlaceBetSlip: (
    stake: number,
    betType: "single" | "accumulator",
  ) => Promise<boolean>;
  handleQuestAction: (id: string) => void;
  handleQuestClaim: (id: string) => void;
  handleRedeem: (
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  handleReferral: (
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  handleClaimAllianceRewards: () => Promise<void>;
  handleAdminSyncRequest: () => void;
  handleAdminAuthSuccess: () => void;
  handleAdminLogout: () => Promise<void>;

  // UI State
  bettingOn: Match | null;
  setBettingOn: React.Dispatch<React.SetStateAction<Match | null>>;
  watchingMatchId: string | null;
  setWatchingMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedLeagueId: string;
  setSelectedLeagueId: React.Dispatch<React.SetStateAction<string>>;
  showWallet: boolean;
  setShowWallet: React.Dispatch<React.SetStateAction<boolean>>;
  showSwapConfirm: boolean;
  setShowSwapConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  showAdmin: boolean;
  setShowAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  showAdminAuth: boolean;
  setShowAdminAuth: React.Dispatch<React.SetStateAction<boolean>>;
  adminSessionValid: boolean;
  adminSessionToken: string | null;

  // Game Loop
  generateRoundMatches: (
    round: number,
    sId: number,
    clientSeed: string,
  ) => Promise<void>;
  handleStateTransition: () => void;
  updateLiveScores: () => void;
  processResults: () => Promise<void>;
  fetchMatches: () => Promise<void>;
  fetchStandings: () => Promise<void>;
  fetchActiveBets: () => Promise<void>;
  getCurrentGameMinute: () => number;
  dashboardMounted: boolean;
  setDashboardMounted: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ==========================================
// PROVIDER
// ==========================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Session token management
  const adminSessionTokenRef = useRef<string | null>(null);

  // Wallet
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    isVerified: false,
    verificationSignature: null,
    verificationTimestamp: null,
  });

  // User
  const [isNewUser, setIsNewUser] = useState(true);
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

  // Registration
  const [registrationData, setRegistrationData] = useState<{
    username: string;
    leagueId: string;
    teamId: string;
  } | null>(null);

  // Balance
  const [balance, setBalance] = useState(INITIAL_BALANCE);

  // Game State
  const [gameState, setGameState] = useState<GameState>("BETTING");
  const [timer, setTimer] = useState(ROUND_DURATION_SEC);
  const [roundNumber, setRoundNumber] = useState(1);
  const [seasonId, setSeasonId] = useState(1);

  // Matches
  const [matches, setMatches] = useState<Match[]>([]);
  const serverSeedsRef = useRef<Record<string, string>>({});

  // Bets
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [betSlipSelections, setBetSlipSelections] = useState<
    BetSlipSelection[]
  >([]);

  // League Tables
  const [leagueTables, setLeagueTables] = useState<
    Record<string, LeagueEntry[]>
  >({});

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // UI State
  const [bettingOn, setBettingOn] = useState<Match | null>(null);
  const [watchingMatchId, setWatchingMatchId] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(LEAGUES[0].id);
  const [showWallet, setShowWallet] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminSessionValid, setAdminSessionValid] = useState(false);

  // Dashboard tracking
  const [dashboardMounted, setDashboardMounted] = useState(false);

  // ==========================================
  // HANDLERS
  // ==========================================

  const addTransaction = useCallback(
    (
      type: Transaction["type"],
      amount: number,
      currency: "kor" | "coins",
      description: string,
    ) => {
      setTransactions((prev) => [
        {
          id: `t${Date.now()}`,
          type,
          amount,
          currency,
          description,
          timestamp: Date.now(),
          hash: generateHash(),
        },
        ...prev.slice(0, 49),
      ]);
    },
    [],
  );

  const refreshProfile = useCallback(async (address: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/user/profile?walletAddress=${address.toLowerCase()}`,
      );
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        setUserStats((prev) => ({
          ...prev,
          username: u.username || prev.username,
          walletAddress: u.wallet_address || address.toLowerCase(),
          coins: u.coins ?? prev.coins,
          korBalance: u.doodl_balance ?? prev.korBalance,
          totalBets: u.total_bets ?? prev.totalBets,
          wins: u.wins ?? prev.wins,
          biggestWin: u.biggest_win ?? prev.biggestWin,
          currentStreak: u.current_streak ?? prev.currentStreak,
          longestStreak: u.longest_streak ?? prev.longestStreak,
          bestOddsWon: u.best_odds_won ?? prev.bestOddsWon,
          level: u.level ?? prev.level,
          xp: u.xp ?? prev.xp,
          loginStreak: u.login_streak ?? prev.loginStreak,
          referralCode: u.referral_code || prev.referralCode,
          referralCount: u.referral_count ?? prev.referralCount,
          referralEarnings: u.referral_earnings ?? prev.referralEarnings,
          dailyWalkPoints: u.daily_walk_points ?? prev.dailyWalkPoints,
          lastWalkDate: u.last_walk_date || prev.lastWalkDate,
          allianceLeagueId: u.alliance_league_id || prev.allianceLeagueId,
          allianceTeamId: u.alliance_team_id || prev.allianceTeamId,
          unclaimedAllianceRewards:
            u.unclaimed_alliance_rewards ?? prev.unclaimedAllianceRewards,
        }));
        setBalance(u.doodl_balance ?? INITIAL_BALANCE);
        setIsNewUser(false);
      }
    } catch (err) {
      console.error("Profile refresh failed:", err);
    }
  }, []);

  const handleWalletConnected = useCallback(
    (address: string) => {
      setWalletState((prev) => ({ ...prev, address, isConnected: true }));
      refreshProfile(address);
    },
    [refreshProfile],
  );

  const handleMessageSigned = useCallback(() => {
    setWalletState((prev) => ({
      ...prev,
      isVerified: true,
      verificationTimestamp: Date.now(),
    }));
    if (walletState.address) {
      localStorage.setItem(`verified_${walletState.address}`, "true");
    }
  }, [walletState.address]);

  const handleProceedFromWelcome = useCallback(() => {
    localStorage.setItem(`user_${userStats.walletAddress}`, userStats.username);
    localStorage.setItem("onboarding_complete", "true");
  }, [userStats.walletAddress, userStats.username]);

  const handleLogout = useCallback(() => {
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
    setWalletState({
      address: null,
      isConnected: false,
      chainId: null,
      isVerified: false,
      verificationSignature: null,
      verificationTimestamp: null,
    });
    localStorage.removeItem("onboarding_complete");
  }, []);

  // ==========================================
  // BETTING HANDLERS
  // ==========================================

  const handleBetPlacement = useCallback(
    async (match: Match, selection: Bet["selection"], stake: number) => {
      if (stake > userStats.korBalance) return false;
      if (!match.odds) return false;

      try {
        const oddValue =
          match.odds[selection as keyof typeof match.odds] || 1.5;
        const res = await fetch(`${API_URL}/api/minigame/bet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress:
              walletState.address ||
              userStats.walletAddress ||
              (userStats.username
                ? `guest-${userStats.username}`
                : "guest-user"),
            matchId: match.id,
            selection,
            stake,
            odds: oddValue,
          }),
        });
        const data = await res.json();
        if (data.success) {
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
          addTransaction("bet", stake, "kor", "Match wager");
          setUserStats((prev) => ({
            ...prev,
            quests: prev.quests.map((q) =>
              q.type === "bet"
                ? { ...q, progress: q.progress + Number(stake) }
                : q,
            ),
          }));
          return true;
        } else {
          return false;
        }
      } catch (e) {
        console.error("Bet placement failed", e);
        return false;
      }
    },
    [userStats.korBalance, userStats.walletAddress, addTransaction],
  );

  const handleAddToBetSlip = useCallback(
    (
      match: Match,
      selection: "home" | "draw" | "away" | "gg" | "nogg",
      odds: number,
    ) => {
      const exists = betSlipSelections.some(
        (sel) => sel.matchId === match.id && sel.selection === selection,
      );
      if (exists) {
        setBetSlipSelections((prev) =>
          prev.filter(
            (sel) => !(sel.matchId === match.id && sel.selection === selection),
          ),
        );
        return;
      }
      // Generate label from selection
      const labels = {
        home: match.homeTeam.name,
        away: match.awayTeam.name,
        draw: "Draw",
        gg: "Both Teams Score",
        nogg: "No Goals",
      };
      const label = labels[selection] || selection;
      setBetSlipSelections((prev) => [
        ...prev,
        { matchId: match.id, match, selection, odds, selectionLabel: label },
      ]);
    },
    [betSlipSelections],
  );

  const handleRemoveFromBetSlip = useCallback((matchId: string) => {
    setBetSlipSelections((prev) =>
      prev.filter((sel) => sel.matchId !== matchId),
    );
  }, []);

  const handleClearBetSlip = useCallback(() => {
    setBetSlipSelections([]);
  }, []);

  const handlePlaceBetSlip = useCallback(
    async (stake: number, betType: "single" | "accumulator") => {
      if (betSlipSelections.length === 0) return false;

      const userWallet =
        walletState.address ||
        userStats.walletAddress ||
        (userStats.username ? `guest-${userStats.username}` : "guest-user");

      try {
        if (betType === "single") {
          for (const sel of betSlipSelections) {
            const res = await fetch(`${API_URL}/api/minigame/bet`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walletAddress:
                  walletState.address ||
                  userStats.walletAddress ||
                  (userStats.username
                    ? `guest-${userStats.username}`
                    : "guest-user"),
                matchId: sel.matchId,
                selection: sel.selection,
                stake,
                odds: sel.odds,
                betType: "single",
              }),
            });
            const data = await res.json();
            if (data.success) {
              setActiveBets((prev) => [
                ...prev,
                {
                  id: data.betId || `bet-${Date.now()}-${Math.random()}`,
                  matchId: sel.matchId,
                  selection: sel.selection,
                  odds: sel.odds,
                  stake,
                  potentialReturn: stake * sel.odds,
                  status: "pending",
                  timestamp: Date.now(),
                  txHash: generateHash(),
                  betType: "single",
                },
              ]);
              if (data.newBalance !== undefined) {
                setBalance(data.newBalance);
                setUserStats((prev) => ({
                  ...prev,
                  korBalance: data.newBalance,
                }));
              }
            }
          }
          const totalStake = stake * betSlipSelections.length;
          setUserStats((s) => ({
            ...s,
            totalBets: s.totalBets + betSlipSelections.length,
          }));

          addTransaction(
            "bet",
            totalStake,
            "kor",
            `${betSlipSelections.length} single bets`,
          );
          setBetSlipSelections([]); // Clear slip on success
          return true;
        } else {
          const accumulatorId = `acc-${Date.now()}`;
          const totalOdds = betSlipSelections.reduce(
            (acc, sel) => acc * sel.odds,
            1,
          );
          const res = await fetch(`${API_URL}/api/minigame/bet-accumulator`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress:
                walletState.address ||
                userStats.walletAddress ||
                (userStats.username
                  ? `guest-${userStats.username}`
                  : "guest-user"),
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
            betSlipSelections.forEach((sel) => {
              setActiveBets((prev) => [
                ...prev,
                {
                  id: `${accumulatorId}-${sel.matchId}`,
                  matchId: sel.matchId,
                  selection: sel.selection,
                  odds: sel.odds,
                  stake,
                  potentialReturn: stake * totalOdds,
                  status: "pending",
                  timestamp: Date.now(),
                  txHash: generateHash(),
                  betType: "accumulator",
                  accumulatorId,
                },
              ]);
            });
            if (data.newBalance !== undefined) {
              setBalance(data.newBalance);
              setUserStats((prev) => ({
                ...prev,
                korBalance: data.newBalance,
              }));
            }
            setUserStats((s) => ({
              ...s,
              totalBets: s.totalBets + 1,
            }));

            addTransaction(
              "bet",
              stake,
              "kor",
              `Accumulator (${betSlipSelections.length} selections)`,
            );
          } else {
            return false;
          }
        }
        fetchActiveBets();
        setBetSlipSelections([]);
        return true;
      } catch (e) {
        console.error("Bet slip placement failed", e);
        return false;
      }
    },
    [betSlipSelections, userStats.walletAddress, addTransaction],
  );

  // ==========================================
  // QUEST & PROFILE HANDLERS
  // ==========================================

  const handleQuestAction = useCallback((id: string) => {
    setUserStats((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === id && q.type === "click"
          ? { ...q, progress: q.target, completed: true }
          : q,
      ),
    }));
  }, []);

  const handleQuestClaim = useCallback(
    (id: string) => {
      const quest = userStats.quests.find((q) => q.id === id);
      if (!quest || !quest.completed) return;
      setUserStats((prev) => ({
        ...prev,
        coins: prev.coins + quest.reward,
        quests: prev.quests.filter((q) => q.id !== id),
      }));
      addTransaction(
        "bonus",
        quest.reward,
        "coins",
        `Quest reward: ${quest.title}`,
      );
    },
    [userStats.quests, addTransaction],
  );

  const handleRedeem = useCallback(
    async (code: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API_URL}/api/coupons/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            walletAddress: userStats.walletAddress,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.type === "coins") {
            setUserStats((prev) => ({
              ...prev,
              coins: prev.coins + data.value,
            }));
            addTransaction(
              "redeem",
              data.value,
              "coins",
              `Redeemed code: ${code}`,
            );
          } else if (data.type === "theme") {
            setUserStats((prev) => ({ ...prev, activeTheme: data.value }));
          }
          return { success: true, message: data.message || "Code redeemed!" };
        }
        return { success: false, message: data.error || "Invalid code" };
      } catch {
        return { success: false, message: "Connection failed" };
      }
    },
    [userStats.walletAddress, addTransaction],
  );

  const handleReferral = useCallback(
    async (code: string): Promise<{ success: boolean; message?: string }> => {
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
        if (!res.ok) return { success: false, message: json.error || "Failed" };
        return { success: true, message: "Referral linked!" };
      } catch {
        return { success: false, message: "Connection failed" };
      }
    },
    [walletState.address],
  );

  const handleClaimAllianceRewards = useCallback(async () => {
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
  }, [userStats.walletAddress, refreshProfile]);

  // ==========================================
  // ADMIN HANDLERS
  // ==========================================

  const handleAdminSyncRequest = useCallback(() => {
    setShowAdminAuth(true);
  }, []);

  const handleAdminAuthSuccess = useCallback(() => {
    adminSessionTokenRef.current = getSessionToken();
    setAdminSessionValid(true);
    setShowAdminAuth(false);
    setShowAdmin(true);
  }, []);

  const handleAdminLogout = useCallback(async () => {
    if (adminSessionTokenRef.current) {
      await logoutAdmin(adminSessionTokenRef.current);
    }
    clearSessionToken();
    adminSessionTokenRef.current = null;
    setAdminSessionValid(false);
    setShowAdmin(false);
  }, []);

  // Check for existing admin session on mount
  useEffect(() => {
    const check = async () => {
      const hasSession = await hasValidAdminSession();
      if (hasSession) {
        adminSessionTokenRef.current = getSessionToken();
        setAdminSessionValid(true);
      }
    };
    check();
  }, []);

  // ==========================================
  // GAME LOOP & DATA FETCHING
  // ==========================================

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/matches/current`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);

        // Update Round Info & Timer from Server Logic
        if (data.matches.length > 0) {
          const first = data.matches[0];
          setRoundNumber(first.round);
          setSeasonId(first.seasonId);

          if (data.serverTime && first.startTime) {
            const serverTime = new Date(data.serverTime).getTime();
            const roundStartTime = new Date(first.startTime).getTime();
            const bettingEndTime = roundStartTime + ROUND_DURATION_SEC * 1000;
            const matchEndTime = bettingEndTime + MATCH_DURATION_SEC * 1000;

            if (serverTime < bettingEndTime) {
              // BETTING PHASE
              setGameState("BETTING");
              const remaining = Math.max(
                0,
                Math.floor((bettingEndTime - serverTime) / 1000),
              );
              setTimer(remaining);
            } else if (serverTime < matchEndTime) {
              // LIVE PHASE
              setGameState("LIVE");
              const elapsed = Math.floor((serverTime - bettingEndTime) / 1000);
              setTimer(elapsed);
            } else {
              // FINISHED (Waiting for next round)
              setGameState("FINISHED");
              // Usually loop moves to next round fast.
              setTimer(0);
            }
          }
        }

        // Update game state based on matches status
        const hasLiveMatches = data.matches.some(
          (m: Match) => m.status === "LIVE",
        );
        const hasFinishedMatches = data.matches.some(
          (m: Match) => m.status === "FINISHED",
        );

        if (hasLiveMatches) {
          setGameState("LIVE");
        } else if (hasFinishedMatches && !hasLiveMatches) {
          setGameState("FINISHED");
        } else {
          setGameState("BETTING");
        }
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  }, [selectedLeagueId]);

  const fetchActiveBets = useCallback(async () => {
    const activeAddress =
      walletState.address ||
      userStats.walletAddress ||
      (userStats.username ? `guest-${userStats.username}` : "guest-user");

    if (!activeAddress) return;

    try {
      const res = await fetch(
        `${API_URL}/api/bets/active?walletAddress=${activeAddress}`,
      );
      const data = await res.json();
      if (data.success) {
        setActiveBets(data.bets);
      }
    } catch (error) {
      console.error("Failed to fetch active bets:", error);
    }
  }, [walletState.address, userStats.walletAddress, userStats.username]);

  // Define fetchActiveBets before useEffect

  // Timer logic for visual countdown/countup
  useEffect(() => {
    if (!dashboardMounted) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (gameState === "BETTING") {
          if (prev <= 0) {
            fetchMatches();
            return 0;
          }
          return prev - 1;
        } else if (gameState === "LIVE") {
          // Count UP
          if (prev >= MATCH_DURATION_SEC) {
            fetchMatches();
            return prev;
          }
          return prev + 1;
        } else if (gameState === "FINISHED") {
          fetchMatches();
          return 0;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dashboardMounted, fetchMatches, gameState]);

  // Unused placeholders kept to satisfy interface
  const generateRoundMatches = useCallback(async () => {
    console.log("Client generation disabled - waiting for server");
  }, []);
  const handleStateTransition = useCallback(() => {
    fetchMatches();
  }, [fetchMatches]);
  const updateLiveScores = useCallback(() => {
    // Only used for client-side visual interpolation if needed
    // But real data comes from polling
  }, []);
  const processResults = useCallback(async () => {
    fetchMatches();
  }, [fetchMatches]);
  const fetchStandings = useCallback(
    async (overrideSeasonId?: number) => {
      try {
        // Use active seasonId if not overridden. If both are null/0, send undefined.
        // Server handles undefined by finding active season.
        const targetSeasonId = overrideSeasonId || seasonId;

        const query = targetSeasonId ? `?seasonId=${targetSeasonId}` : "";

        const res = await fetch(`${API_URL}/api/leagues/standings${query}`);
        const data = await res.json();

        console.log("fetchStandings response:", data);

        if (data && data.success && Array.isArray(data.standings)) {
          // Group by leagueId
          const grouped: Record<string, LeagueEntry[]> = {};
          data.standings.forEach((team: any) => {
            if (!grouped[team.leagueId]) grouped[team.leagueId] = [];
            grouped[team.leagueId].push(team);
          });
          console.log("Grouped Standings:", grouped);
          setLeagueTables(grouped);
        } else if (
          data &&
          typeof data === "object" &&
          !data.error &&
          !data.standings
        ) {
          console.log("Setting League Tables (Standard Object):", data);
          setLeagueTables(data);
        } else {
          console.warn("Unexpected standings format:", data);
        }
      } catch (error) {
        console.error("Failed to fetch standings:", error);
      }
    },
    [seasonId],
  );
  // Poll for matches and bets
  useEffect(() => {
    if (!dashboardMounted) return;

    fetchMatches();
    fetchStandings(); // Initial fetch

    // Poll matches and standings
    const interval = setInterval(() => {
      fetchMatches();
      fetchStandings();
    }, 5000);

    // Poll bets if user is connected
    let betInterval: ReturnType<typeof setInterval>;
    if (walletState.isConnected && walletState.address) {
      fetchActiveBets();
      betInterval = setInterval(fetchActiveBets, 5000);
    }

    return () => {
      clearInterval(interval);
      if (betInterval) clearInterval(betInterval);
    };
  }, [
    dashboardMounted,
    fetchMatches,
    fetchStandings,
    fetchActiveBets,
    walletState.isConnected,
    walletState.address,
  ]);

  const getCurrentGameMinute = useCallback(() => {
    if (gameState !== "LIVE") return 0;
    const total = MATCH_DURATION_SEC;
    const elapsed = timer;
    const minute = Math.floor((elapsed / total) * 90);
    return Math.min(90, Math.max(0, minute));
  }, [gameState, timer]);

  return (
    <GameContext.Provider
      value={{
        walletState,
        setWalletState,
        userStats,
        setUserStats,
        isNewUser,
        setIsNewUser,
        registrationData,
        setRegistrationData,
        balance,
        setBalance,
        gameState,
        setGameState,
        timer,
        setTimer,
        roundNumber,
        setRoundNumber,
        seasonId,
        setSeasonId,
        matches,
        setMatches,
        activeBets,
        setActiveBets,
        betSlipSelections,
        setBetSlipSelections,
        leagueTables,
        setLeagueTables,
        transactions,
        addTransaction,
        coupons,
        setCoupons,
        bettingOn,
        setBettingOn,
        watchingMatchId,
        setWatchingMatchId,
        selectedLeagueId,
        setSelectedLeagueId,
        showWallet,
        setShowWallet,
        showSwapConfirm,
        setShowSwapConfirm,
        showAdmin,
        setShowAdmin,
        showAdminAuth,
        setShowAdminAuth,
        adminSessionValid,
        adminSessionToken: adminSessionTokenRef.current,
        generateRoundMatches,
        handleStateTransition,
        updateLiveScores,
        processResults,
        fetchMatches,
        fetchStandings,
        fetchActiveBets,
        getCurrentGameMinute,
        dashboardMounted,
        setDashboardMounted,
        handleWalletConnected,
        handleMessageSigned,
        handleProceedFromWelcome,
        handleLogout,
        refreshProfile,
        handleBetPlacement,
        handleAddToBetSlip,
        handleRemoveFromBetSlip,
        handleClearBetSlip,
        handlePlaceBetSlip,
        handleQuestAction,
        handleQuestClaim,
        handleRedeem,
        handleReferral,
        handleClaimAllianceRewards,
        handleAdminSyncRequest,
        handleAdminAuthSuccess,
        handleAdminLogout,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
