import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";
import { BetSlipSelection } from "../types";
import {
  IconX,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconCheck,
  IconTicket,
} from "./Icons";

interface BetSlipProps {
  selections: BetSlipSelection[];
  balance: number;
  onRemoveSelection: (matchId: string) => void;
  onClearAll: () => void;
  onPlaceBet: (
    stake: number,
    betType: "single" | "accumulator",
  ) => Promise<boolean>;
}

export function BetSlip({
  selections,
  balance,
  onRemoveSelection,
  onClearAll,
  onPlaceBet,
}: BetSlipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stake, setStake] = useState(10);
  const [betType, setBetType] = useState<"single" | "accumulator">(
    selections.length > 1 ? "accumulator" : "single",
  );
  const [isLoading, setIsLoading] = useState(false);

  if (selections.length === 0) {
    return null;
  }

  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialWin =
    betType === "accumulator"
      ? stake * totalOdds
      : selections.reduce((acc, sel) => acc + stake * sel.odds, 0);

  const canPlaceBet = stake > 0 && stake <= balance;

  const handlePlaceBet = async () => {
    if (canPlaceBet) {
      setIsLoading(true);
      try {
        const success = await onPlaceBet(stake, betType);
        if (success) {
          toast.success("Bets placed successfully!");
          // onClearAll(); // Usually handled by parent or context logic
        } else {
          toast.error("Failed to place bets.");
        }
      } catch (error) {
        toast.error("An error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSelectionLabel = (sel: BetSlipSelection) => {
    switch (sel.selection) {
      case "home":
        return `${sel.match.homeTeam.name} Win`;
      case "away":
        return `${sel.match.awayTeam.name} Win`;
      case "draw":
        return "Draw";
      case "gg":
        return "Both Teams Score";
      case "nogg":
        return "No GG";
      default:
        return sel.selectionLabel;
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg transition-all duration-300",
        isExpanded ? "max-h-[70vh]" : "max-h-20",
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconTicket className="w-6 h-6 text-primary" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {selections.length}
            </span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">Bet Slip</p>
            <p className="text-xs text-muted-foreground">
              {selections.length} selection{selections.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Potential Win</p>
            <p className="font-bold text-primary">
              {potentialWin.toFixed(2)} KOR
            </p>
          </div>
          {isExpanded ? (
            <IconChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <IconChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 max-h-[calc(70vh-5rem)] overflow-y-auto">
          {/* Bet Type Toggle */}
          {selections.length > 1 && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => setBetType("single")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  betType === "single"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Singles ({selections.length})
              </button>
              <button
                onClick={() => setBetType("accumulator")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  betType === "accumulator"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Accumulator
              </button>
            </div>
          )}

          {/* Selections List */}
          <div className="space-y-2 mb-4">
            {selections.map((sel) => (
              <div
                key={sel.matchId}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sel.match.homeTeam.name} vs {sel.match.awayTeam.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {getSelectionLabel(sel)}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      @{sel.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveSelection(sel.matchId)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Total Odds (for accumulator) */}
          {betType === "accumulator" && selections.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-4">
              <span className="text-sm font-medium text-foreground">
                Combined Odds
              </span>
              <span className="text-lg font-bold text-primary">
                {totalOdds.toFixed(2)}
              </span>
            </div>
          )}

          {/* Stake Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                {betType === "single" ? "Stake per bet" : "Total Stake"}
              </label>
              <span className="text-xs text-muted-foreground">
                Balance: {balance.toLocaleString()} KOR
              </span>
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStake(amount)}
                  disabled={amount > balance}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    stake === amount
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                    amount > balance && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {amount}
                </button>
              ))}
              <input
                type="number"
                value={stake}
                onChange={(e) =>
                  setStake(Math.min(Number(e.target.value), balance))
                }
                className="input w-24 text-center"
                min={1}
                max={balance}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {betType === "single"
                  ? `${selections.length} x ${stake} KOR`
                  : "Total Stake"}
              </span>
              <span className="text-sm font-medium text-foreground">
                {betType === "single"
                  ? (selections.length * stake).toFixed(2)
                  : stake.toFixed(2)}{" "}
                KOR
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-foreground">
                Potential Win
              </span>
              <span className="text-lg font-bold text-primary">
                {potentialWin.toFixed(2)} KOR
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClearAll} className="btn btn-outline h-12 px-4">
              <IconTrash className="w-4 h-4 mr-2" />
              Clear
            </button>
            <button
              onClick={handlePlaceBet}
              disabled={!canPlaceBet}
              className={cn(
                "btn btn-primary flex-1 h-12 font-semibold",
                !canPlaceBet && "opacity-50 cursor-not-allowed",
              )}
            >
              <IconCheck className="w-5 h-5 mr-2" />
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : stake > balance ? (
                "Insufficient Balance"
              ) : (
                `Place ${betType === "single" ? "Bets" : "Bet"}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BetSlip;
