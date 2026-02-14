import { cn } from "../lib/utils";
import { Match } from "../types";
import { IconClock, IconPlay, IconCheck, IconPlus } from "./Icons";
import { TeamLogo } from "./TeamLogo";

interface MatchCardProps {
  match: Match;
  minute?: number;
  displayScore?: { home: number; away: number };
  onBet: (match: Match) => void;
  onWatch: (match: Match) => void;
  onAddToBetSlip: (
    match: Match,
    selection: "home" | "draw" | "away" | "gg" | "nogg",
    odds: number,
  ) => void;
}

export function MatchCard({
  match,
  minute,
  displayScore,
  onBet,
  onWatch,
  onAddToBetSlip,
}: MatchCardProps) {
  const statusConfig = {
    SCHEDULED: {
      label: "Upcoming",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: IconClock,
    },
    LIVE: {
      label: "LIVE",
      className: "bg-red-500 text-white border-red-500 animate-pulse",
      icon: IconPlay,
    },
    FINISHED: {
      label: "ROUND ENDED",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      icon: IconCheck,
    },
    RESULT: {
      label: "FINAL SCORE",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      icon: IconCheck,
    },
  };

  const status = statusConfig[match.status];
  const StatusIcon = status.icon;

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const currentScore = displayScore || match.currentScore;

  return (
    <div
      className={cn(
        "card p-4 transition-all duration-200 hover:shadow-md",
        isLive && "ring-2 ring-red-500/50 shadow-lg",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "badge flex items-center gap-1 text-[10px]",
              status.className,
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          {isLive && minute !== undefined && (
            <span className="font-mono text-sm font-bold text-red-500 animate-pulse">
              {minute}'
            </span>
          )}
        </div>

        {isLive && currentScore && (
          <span className="font-mono text-sm font-bold text-foreground">
            {currentScore.home} - {currentScore.away}
          </span>
        )}
        {isFinished && match.result && (
          <span className="font-mono text-sm font-bold text-muted-foreground">
            {match.result.homeScore} - {match.result.awayScore}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo
            name={match.homeTeam.name}
            color={match.homeTeam.color}
            size="md"
            className="shrink-0"
          />
          <span className="font-semibold text-xs md:text-sm text-foreground truncate">
            {match.homeTeam.name}
          </span>
        </div>

        {/* VS */}
        <div className="px-2 shrink-0">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            VS
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
          <span className="font-semibold text-xs md:text-sm text-foreground truncate">
            {match.awayTeam.name}
          </span>
          <TeamLogo
            name={match.awayTeam.name}
            color={match.awayTeam.color}
            size="md"
            className="shrink-0"
          />
        </div>
      </div>

      {/* Odds */}
      {!isFinished && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <OddsButton
            label="1"
            odds={match.odds.home}
            disabled={isFinished}
            onClick={() => onAddToBetSlip(match, "home", match.odds.home)}
          />
          <OddsButton
            label="X"
            odds={match.odds.draw}
            disabled={isFinished}
            onClick={() => onAddToBetSlip(match, "draw", match.odds.draw)}
          />
          <OddsButton
            label="2"
            odds={match.odds.away}
            disabled={isFinished}
            onClick={() => onAddToBetSlip(match, "away", match.odds.away)}
          />
        </div>
      )}

      {/* Additional Odds - GG/NOGG */}
      {!isFinished && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <OddsButton
            label="GG"
            subLabel="Both Score"
            odds={match.odds.gg}
            disabled={isFinished}
            onClick={() => onAddToBetSlip(match, "gg", match.odds.gg)}
            variant="secondary"
          />
          <OddsButton
            label="NG"
            subLabel="No GG"
            odds={match.odds.nogg}
            disabled={isFinished}
            onClick={() => onAddToBetSlip(match, "nogg", match.odds.nogg)}
            variant="secondary"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isLive && (
          <button
            onClick={() => onWatch(match)}
            className="btn btn-primary flex-1 h-9 text-xs gap-1"
          >
            <IconPlay className="w-3 h-3" />
            Watch Live
          </button>
        )}
        {!isFinished && (
          <button
            onClick={() => onBet(match)}
            className="btn btn-outline flex-1 h-9 text-xs"
          >
            Quick Bet
          </button>
        )}
        {isFinished && match.result && (
          <div className="w-full text-center py-2 text-sm text-muted-foreground">
            Final: {match.result.homeScore} - {match.result.awayScore}
          </div>
        )}
      </div>
    </div>
  );
}

interface OddsButtonProps {
  label: string;
  subLabel?: string;
  odds: number;
  disabled?: boolean;
  onClick: () => void;
  variant?: "default" | "secondary";
}

function OddsButton({
  label,
  subLabel,
  odds,
  disabled,
  onClick,
  variant = "default",
}: OddsButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all",
        "hover:border-primary hover:bg-primary/5",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent",
        variant === "default"
          ? "bg-card border-border"
          : "bg-secondary/50 border-secondary",
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          {label}
        </span>
        {subLabel && (
          <span className="text-[8px] text-muted-foreground">({subLabel})</span>
        )}
      </div>
      <span className="font-mono text-sm font-bold text-primary">
        {odds.toFixed(2)}
      </span>
      <IconPlus className="absolute top-1 right-1 w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default MatchCard;
