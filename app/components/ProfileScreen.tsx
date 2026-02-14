import { useState } from "react";
import { cn } from "../lib/utils";
import { UserStats, DailyQuest, AppTheme } from "../types";
import { CONVERSION_RATE, CONVERSION_YIELD } from "../constants";
import {
  IconUser,
  IconWallet,
  IconCoins,
  IconTrophy,
  IconStar,
  IconTarget,
  IconUsers,
  IconShare,
  IconCopy,
  IconCheck,
  IconGift,
  IconZap,
  IconSettings,
  IconLogOut,
  IconChevronRight,
  IconFlame,
  IconAward,
  IconExternalLink,
  IconPlay,
} from "./Icons";
import { truncateAddress, formatNumber } from "../lib/utils";

interface ProfileScreenProps {
  stats: UserStats;
  onLogout: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; message?: string }>;
  onQuestClaim: (questId: string) => void;
  onQuestAction: (questId: string) => void;
  onReferral: (code: string) => Promise<{ success: boolean; message?: string }>;
  onSystemSync: () => void;
  onOpenWallet: () => void;
  onClaimAllianceRewards: () => void;
}

export function ProfileScreen({
  stats,
  onLogout,
  onRedeem,
  onQuestClaim,
  onQuestAction,
  onReferral,
  onSystemSync,
  onOpenWallet,
  onClaimAllianceRewards,
}: ProfileScreenProps) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "quests" | "referral" | "settings"
  >("overview");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [copied, setCopied] = useState(false);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    const result = await onRedeem(redeemCode.trim());
    setRedeemStatus({
      type: result.success ? "success" : "error",
      message: result.message || (result.success ? "Code redeemed!" : "Invalid code"),
    });
    if (result.success) {
      setRedeemCode("");
    }
  };

  const handleReferral = async () => {
    if (!referralCode.trim()) return;
    const result = await onReferral(referralCode.trim());
    setReferralStatus({
      type: result.success ? "success" : "error",
      message: result.message || (result.success ? "Referral applied!" : "Invalid code"),
    });
    if (result.success) {
      setReferralCode("");
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const winRate =
    stats.totalBets > 0
      ? Math.round((stats.wins / stats.totalBets) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <IconUser className="w-8 h-8" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">
              {stats.username}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              {truncateAddress(stats.walletAddress)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-default text-xs">
                Level {stats.level}
              </span>
              {stats.loginStreak > 0 && (
                <span className="badge badge-secondary text-xs flex items-center gap-1">
                  <IconFlame className="w-3 h-3" />
                  {stats.loginStreak} day streak
                </span>
              )}
            </div>
          </div>

          {/* Wallet Button */}
          <button
            onClick={onOpenWallet}
            className="btn btn-outline h-10 px-4"
          >
            <IconWallet className="w-4 h-4" />
          </button>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Experience</span>
            <span className="text-foreground font-medium">
              {stats.xp} / {(stats.level + 1) * 1000} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(stats.xp / ((stats.level + 1) * 1000)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconCoins className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Coins</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatNumber(stats.coins)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.floor(stats.coins / CONVERSION_RATE) * CONVERSION_YIELD} KOR
            available
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <IconZap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">KOR Tokens</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatNumber(stats.korBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available balance</p>
        </div>
      </div>

      {/* Alliance Rewards Banner */}
      {stats.unclaimedAllianceRewards > 0 && (
        <button
          onClick={onClaimAllianceRewards}
          className="card p-4 w-full bg-primary/10 border-primary/30 hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <IconGift className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Alliance Rewards</p>
                <p className="text-sm text-muted-foreground">
                  {stats.unclaimedAllianceRewards} coins to claim
                </p>
              </div>
            </div>
            <IconChevronRight className="w-5 h-5 text-primary" />
          </div>
        </button>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {[
          { id: "overview", label: "Stats" },
          { id: "quests", label: "Quests" },
          { id: "referral", label: "Referral" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
              activeSection === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <IconTrophy className="w-5 h-5 text-primary" />
              Betting Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <StatItem label="Total Bets" value={stats.totalBets} />
              <StatItem label="Wins" value={stats.wins} highlight="green" />
              <StatItem label="Win Rate" value={`${winRate}%`} />
              <StatItem
                label="Biggest Win"
                value={formatNumber(stats.biggestWin)}
                highlight="yellow"
              />
              <StatItem label="Best Odds" value={stats.bestOddsWon.toFixed(2)} />
              <StatItem
                label="Current Streak"
                value={stats.currentStreak}
                highlight={stats.currentStreak > 0 ? "green" : undefined}
              />
            </div>
          </div>

          {/* Achievements - COMING SOON OVERLAY */}
          <div className="card p-4 relative overflow-hidden">

            <ComingSoonOverlay />

            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <IconAward className="w-5 h-5 text-yellow-500" />
              Achievements
            </h3>
            <div className="grid grid-cols-4 gap-3 opacity-50 blur-[1px]">
              <AchievementBadge
                icon={<IconStar />}
                label="First Win"
                unlocked={stats.wins > 0}
              />
              <AchievementBadge
                icon={<IconFlame />}
                label="Hot Streak"
                unlocked={stats.longestStreak >= 5}
              />
              <AchievementBadge
                icon={<IconTarget />}
                label="Sharpshooter"
                unlocked={winRate >= 60}
              />
              <AchievementBadge
                icon={<IconTrophy />}
                label="High Roller"
                unlocked={stats.totalBets >= 100}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quests Section - COMING SOON OVERLAY */}
      {activeSection === "quests" && (
        <div className="space-y-3 relative overflow-hidden min-h-[300px]">
          <ComingSoonOverlay />
          <div className="flex items-center justify-between opacity-50 blur-[1px]">
            <h3 className="font-semibold text-foreground">Daily Quests</h3>
            <span className="text-xs text-muted-foreground">
              {stats.quests.filter((q) => q.completed).length}/{stats.quests.length}{" "}
              completed
            </span>
          </div>

          <div className="opacity-50 blur-[1px] space-y-3">
            {stats.quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onAction={() => onQuestAction(quest.id)}
                onClaim={() => onQuestClaim(quest.id)}
              />
            ))}
          </div>


          {/* Redeem Code */}
          <div className="card p-4 mt-4 opacity-50 blur-[1px]">
            <h4 className="font-medium text-foreground mb-3">Redeem Code</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="input flex-1"
                disabled
              />
              <button
                onClick={handleRedeem}
                disabled={true}
                className="btn btn-primary px-6"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Section - COMING SOON OVERLAY */}
      {activeSection === "referral" && (
        <div className="space-y-4 relative overflow-hidden min-h-[300px]">
          <ComingSoonOverlay />
          <div className="opacity-50 blur-[1px] space-y-4">
            {/* Your Referral Code */}
            <div className="card p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <IconShare className="w-5 h-5 text-primary" />
                Your Referral Code
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-bold text-foreground">
                  {stats.referralCode}
                </div>
                <button
                  onClick={copyReferralCode}
                  className={cn(
                    "btn px-4",
                    copied ? "btn-primary" : "btn-outline"
                  )}
                  disabled
                >
                  {copied ? (
                    <IconCheck className="w-5 h-5" />
                  ) : (
                    <IconCopy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Share your code and earn 100 coins for each friend who joins!
              </p>
            </div>

            {/* Referral Stats */}
            <div className="card p-4">
              <h4 className="font-medium text-foreground mb-3">Referral Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {stats.referralCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Friends Referred</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {formatNumber(stats.referralEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">Coins Earned</p>
                </div>
              </div>
            </div>

            {/* Enter Referral Code */}
            {!stats.hasReferred && (
              <div className="card p-4">
                <h4 className="font-medium text-foreground mb-3">
                  Have a referral code?
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter friend's code"
                    className="input flex-1"
                    disabled
                  />
                  <button
                    onClick={handleReferral}
                    disabled={true}
                    className="btn btn-primary px-6"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Settings Section */}
      {activeSection === "settings" && (
        <div className="space-y-3">
          <SettingsButton
            icon={<IconWallet className="w-5 h-5" />}
            label="Wallet Settings"
            onClick={onOpenWallet}
          />
          <SettingsButton
            icon={<IconSettings className="w-5 h-5" />}
            label="Sync Account"
            description="Refresh your account data"
            onClick={onSystemSync}
          />
          <SettingsButton
            icon={<IconLogOut className="w-5 h-5 text-destructive" />}
            label="Logout"
            description="Disconnect your wallet"
            onClick={onLogout}
            variant="danger"
          />
        </div>
      )}
    </div>
  );
}

// Sub-components
function ComingSoonOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg border border-dashed border-muted-foreground/20">
      <div className="bg-background/80 p-4 rounded-full shadow-lg border mb-2">
        <IconPlay className="w-6 h-6 text-muted-foreground rotate-[-90deg]" /> {/* Using Play icon rotated as a 'construct' placeholder or just use generic */}
      </div>
      <div className="bg-card px-4 py-2 rounded-lg shadow-sm border">
        <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Coming Soon</span>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: "green" | "yellow" | "red";
}

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-xl font-bold",
          highlight === "green" && "text-green-500",
          highlight === "yellow" && "text-yellow-500",
          highlight === "red" && "text-red-500",
          !highlight && "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface AchievementBadgeProps {
  icon: React.ReactNode;
  label: string;
  unlocked: boolean;
}

function AchievementBadge({ icon, label, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
        unlocked
          ? "bg-yellow-500/10 text-yellow-500"
          : "bg-muted/50 text-muted-foreground opacity-50"
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-medium text-center">{label}</span>
    </div>
  );
}

interface QuestCardProps {
  quest: DailyQuest;
  onAction: () => void;
  onClaim: () => void;
}

function QuestCard({ quest, onAction, onClaim }: QuestCardProps) {
  const progress = Math.min((quest.progress / quest.target) * 100, 100);
  const isComplete = quest.progress >= quest.target;
  const canClaim = isComplete && !quest.completed;

  return (
    <div
      className={cn(
        "card p-4 transition-all",
        quest.completed && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{quest.title}</h4>
          <p className="text-xs text-muted-foreground">
            {quest.frequency === "weekly" ? "Weekly" : "Daily"} • +{quest.reward}{" "}
            coins
          </p>
        </div>
        {quest.status === "LIVE" && !quest.completed && (
          <span className="badge bg-green-500/10 text-green-500 text-xs">
            Active
          </span>
        )}
        {quest.completed && (
          <span className="badge bg-primary/10 text-primary text-xs">
            <IconCheck className="w-3 h-3 mr-1" />
            Done
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">
            {quest.progress}/{quest.target}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              quest.completed
                ? "bg-primary/50"
                : isComplete
                  ? "bg-green-500"
                  : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {!quest.completed && (
        <div className="flex gap-2">
          {quest.type === "external" && quest.externalUrl && (
            <a
              href={quest.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onAction()}
              className="btn btn-outline flex-1 h-9 text-sm"
            >
              <IconExternalLink className="w-4 h-4 mr-1" />
              Go
            </a>
          )}
          {quest.type === "click" && !isComplete && (
            <button
              onClick={onAction}
              className="btn btn-outline flex-1 h-9 text-sm"
            >
              Complete
            </button>
          )}
          {canClaim && (
            <button
              onClick={onClaim}
              className="btn btn-primary flex-1 h-9 text-sm"
            >
              <IconGift className="w-4 h-4 mr-1" />
              Claim {quest.reward}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SettingsButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

function SettingsButton({
  icon,
  label,
  description,
  onClick,
  variant = "default",
}: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card w-full p-4 flex items-center gap-4 transition-colors",
        variant === "danger"
          ? "hover:bg-destructive/5 hover:border-destructive/30"
          : "hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          variant === "danger" ? "bg-destructive/10" : "bg-muted"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p
          className={cn(
            "font-medium",
            variant === "danger" ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <IconChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

export default ProfileScreen;
