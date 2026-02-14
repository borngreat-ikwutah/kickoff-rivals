import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import {
  IconSparkles,
  IconCoins,
  IconTrophy,
  IconChevronRight,
  IconGift,
} from "./Icons";

interface WelcomeScreenProps {
  username: string;
  isNew: boolean;
  onProceed: () => void;
}

export function WelcomeScreen({
  username,
  isNew,
  onProceed,
}: WelcomeScreenProps) {
  const [showRewards, setShowRewards] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Animate rewards appearing
    const timer1 = setTimeout(() => setShowRewards(true), 500);
    const timer2 = setTimeout(() => setAnimationComplete(true), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Animated background with celebration effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        {/* Floating particles for celebration */}
        {isNew && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: ["#fbbf24", "#22c55e", "#3b82f6", "#ec4899"][
                    i % 4
                  ],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <RivalsLogo size="md" variant="full" className="text-white" />
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          {/* Welcome Icon */}
          <div className="flex justify-center mb-6 animate-bounce-subtle">
            <div
              className={cn(
                "p-6 rounded-full transition-all duration-500",
                isNew
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30"
                  : "bg-primary/20"
              )}
            >
              {isNew ? (
                <IconSparkles className="w-16 h-16 text-white" />
              ) : (
                <IconTrophy className="w-16 h-16 text-primary" />
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in">
            {isNew ? "Welcome to the Arena!" : "Welcome Back!"}
          </h1>

          <p className="text-xl text-slate-300 mb-2 animate-fade-in">
            {username}
          </p>

          <p className="text-slate-400 mb-8 animate-fade-in">
            {isNew
              ? "Your account has been created successfully!"
              : "Great to see you again. Ready to win?"}
          </p>

          {/* Rewards Section (for new users) */}
          {isNew && showRewards && (
            <div className="space-y-4 mb-8 animate-slide-up">
              <h2 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                <IconGift className="w-5 h-5 text-yellow-400" />
                Your Welcome Bonus
              </h2>

              <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                      <IconCoins className="w-8 h-8 text-yellow-400" />
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">
                      500
                    </span>
                    <span className="text-sm text-slate-400">Coins</span>
                  </div>

                  <div className="text-4xl text-slate-600">+</div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <IconTrophy className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-primary">100</span>
                    <span className="text-sm text-slate-400">KOR Tokens</span>
                  </div>
                </div>

                <p className="text-slate-500 text-sm mt-4">
                  Use these to place your first bets!
                </p>
              </div>
            </div>
          )}

          {/* Returning user stats placeholder */}
          {!isNew && showRewards && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 animate-slide-up">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">--</p>
                  <p className="text-xs text-slate-400">Total Bets</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">--</p>
                  <p className="text-xs text-slate-400">Win Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">--</p>
                  <p className="text-xs text-slate-400">KOR Balance</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {animationComplete && (
            <button
              onClick={onProceed}
              className={cn(
                "btn btn-primary w-full h-14 font-semibold text-lg",
                "hover:scale-[1.02] transition-all duration-300",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "animate-fade-in"
              )}
            >
              {isNew ? "Start Playing" : "Continue"}
              <IconChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}

          {/* Tips */}
          <div className="mt-8 text-slate-500 text-sm animate-fade-in">
            {isNew ? (
              <p>
                Pro tip: Complete daily quests to earn more coins and tokens!
              </p>
            ) : (
              <p>New matches start every few seconds. Good luck!</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-slate-500 text-xs">
        {isNew
          ? "Your progress is saved automatically"
          : "Play responsibly. Virtual currency only."}
      </footer>
    </div>
  );
}

export default WelcomeScreen;
