import { useState } from "react";
import { cn } from "../lib/utils";
import { UserStats, Transaction } from "../types";
import { CONVERSION_RATE, CONVERSION_YIELD } from "../constants";
import {
  IconX,
  IconWallet,
  IconCoins,
  IconZap,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconChevronRight,
} from "./Icons";
import { formatNumber, formatDate, truncateAddress } from "../lib/utils";

interface WalletModalProps {
  onClose: () => void;
  onSwapRequest: () => void;
  currentBalance: number;
  userStats: UserStats;
  onWalkReward: () => void;
}

export function WalletModal({
  onClose,
  onSwapRequest,
  currentBalance,
  userStats,
  onWalkReward,
}: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<"balance" | "history">("balance");

  const canConvert = userStats.coins >= CONVERSION_RATE;
  const convertibleKOR =
    Math.floor(userStats.coins / CONVERSION_RATE) * CONVERSION_YIELD;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <IconWallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Wallet</h2>
              <p className="text-xs text-muted-foreground font-mono">
                {truncateAddress(userStats.walletAddress)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <IconX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-4 mt-4 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab("balance")}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
              activeTab === "balance"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Balance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "balance" && (
            <div className="space-y-4">
              {/* KOR Balance */}
              <div className="card p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconZap className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">
                      KOR Tokens
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Betting Currency
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {formatNumber(userStats.korBalance)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ ${(userStats.korBalance * 0.01).toFixed(2)} USD
                </p>
              </div>

              {/* Coins Balance */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconCoins className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-foreground">Coins</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Rewards Currency
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {formatNumber(userStats.coins)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canConvert
                    ? `Convert to ${convertibleKOR} KOR`
                    : `${CONVERSION_RATE - userStats.coins} more to convert`}
                </p>
              </div>

              {/* Conversion Card */}
              <div className="card p-4 border-dashed">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground">Convert Coins</h3>
                  <span className="text-xs text-muted-foreground">
                    {CONVERSION_RATE} Coins = {CONVERSION_YIELD} KOR
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <IconCoins className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {Math.floor(userStats.coins / CONVERSION_RATE) *
                        CONVERSION_RATE}
                    </p>
                    <p className="text-xs text-muted-foreground">Coins</p>
                  </div>

                  <IconChevronRight className="w-5 h-5 text-muted-foreground" />

                  <div className="flex-1 bg-primary/10 rounded-lg p-3 text-center">
                    <IconZap className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary">
                      {convertibleKOR}
                    </p>
                    <p className="text-xs text-muted-foreground">KOR</p>
                  </div>
                </div>

                <button
                  onClick={onSwapRequest}
                  disabled={!canConvert}
                  className={cn(
                    "btn w-full h-11",
                    canConvert ? "btn-primary" : "btn-secondary opacity-50"
                  )}
                >
                  <IconRefresh className="w-4 h-4 mr-2" />
                  {canConvert ? "Convert Now" : "Not Enough Coins"}
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {formatNumber(userStats.referralEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Referral Earnings
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {formatNumber(userStats.biggestWin)}
                  </p>
                  <p className="text-xs text-muted-foreground">Biggest Win</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">
                Transaction history will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="btn btn-outline w-full h-11">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default WalletModal;
