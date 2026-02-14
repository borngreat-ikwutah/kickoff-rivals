import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import { IconUser, IconSparkles, IconChevronRight } from "./Icons";

interface EntryChoiceProps {
  onNewUser: () => void;
  onReturningUser: () => void;
}

export function EntryChoice({ onNewUser, onReturningUser }: EntryChoiceProps) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-blue-500/6 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 py-5 border-b border-white/5">
        <RivalsLogo size="md" variant="full" className="text-white" />
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 min-h-[calc(100vh-80px)]">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-3 block">
            Almost There
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to the Arena
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Choose how you'd like to enter. New players get a special welcome
            bonus!
          </p>
        </div>

        {/* Choice Cards */}
        <div className="flex flex-col md:flex-row gap-6 max-w-2xl w-full px-4">
          {/* New User */}
          <ChoiceCard
            title="I'm New Here"
            description="Create your account, pick your alliance, and claim your welcome bonus to start winning"
            icon={<IconSparkles className="w-8 h-8" />}
            onClick={onNewUser}
            variant="primary"
            badge="500 Coins Bonus"
          />

          {/* Returning User */}
          <ChoiceCard
            title="Returning Player"
            description="Connect your wallet to access your existing account and continue playing"
            icon={<IconUser className="w-8 h-8" />}
            onClick={onReturningUser}
            variant="secondary"
          />
        </div>

        {/* Help text */}
        <p className="text-slate-600 text-sm text-center mt-12 animate-fade-in">
          Not sure? New users will be guided through a quick setup process.
        </p>
      </div>
    </div>
  );
}

interface ChoiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary";
  badge?: string;
}

function ChoiceCard({
  title,
  description,
  icon,
  onClick,
  variant,
  badge,
}: ChoiceCardProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex-1 overflow-hidden rounded-2xl transition-all duration-300",
        "flex flex-col items-center text-center p-8",
        "glass-card",
        "hover:translate-y-[-6px] hover:shadow-2xl",
        isPrimary
          ? "hover:border-emerald-500/40 hover:shadow-emerald-500/10"
          : "hover:border-slate-500/40 hover:shadow-slate-500/10",
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 animate-glow-pulse">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "mb-5 p-5 rounded-2xl transition-all duration-300",
          isPrimary
            ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110"
            : "bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-slate-700 group-hover:scale-110",
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-5">
        {description}
      </p>

      {/* CTA */}
      <div
        className={cn(
          "flex items-center gap-1 font-semibold text-sm transition-all group-hover:gap-2",
          isPrimary ? "text-emerald-400" : "text-slate-300",
        )}
      >
        Get Started
        <IconChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export default EntryChoice;
