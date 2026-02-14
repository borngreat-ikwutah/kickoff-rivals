import { cn } from "../lib/utils";
import { CONVERSION_RATE, CONVERSION_YIELD } from "../constants";
import {
  IconX,
  IconCoins,
  IconZap,
  IconChevronRight,
  IconCheck,
  IconAlert,
} from "./Icons";

interface SwapConfirmProps {
  coins: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SwapConfirm({ coins, onConfirm, onCancel }: SwapConfirmProps) {
  const convertibleCoins =
    Math.floor(coins / CONVERSION_RATE) * CONVERSION_RATE;
  const resultingKOR =
    Math.floor(coins / CONVERSION_RATE) * CONVERSION_YIELD;
  const remainingCoins = coins - convertibleCoins;

  const canConvert = convertibleCoins > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-background rounded-2xl shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-foreground">Confirm Conversion</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <IconX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Conversion Visual */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* From: Coins */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <IconCoins className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {convertibleCoins.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <IconChevronRight className="w-8 h-8 text-muted-foreground" />
            </div>

            {/* To: KOR */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <IconZap className="w-8 h-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">
                {resultingKOR.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">KOR</p>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Exchange Rate
              </span>
              <span className="text-sm font-medium text-foreground">
                {CONVERSION_RATE} Coins = {CONVERSION_YIELD} KOR
              </span>
            </div>
            {remainingCoins > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Remaining Coins
                </span>
                <span className="text-sm font-medium text-foreground">
                  {remainingCoins.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Warning */}
          {canConvert && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <IconAlert className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This action cannot be undone. Your coins will be permanently
                converted to KOR tokens.
              </p>
            </div>
          )}

          {/* Not Enough Coins Warning */}
          {!canConvert && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-6">
              <IconAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                You need at least {CONVERSION_RATE} coins to convert. You
                currently have {coins} coins.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="btn btn-outline flex-1 h-11"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConvert}
              className={cn(
                "btn btn-primary flex-1 h-11",
                !canConvert && "opacity-50 cursor-not-allowed"
              )}
            >
              <IconCheck className="w-4 h-4 mr-2" />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwapConfirm;
