import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import { IconFootball, IconChevronRight } from "./Icons";

interface GameSelectionProps {
  onSelectFootball: () => void;
}

export function GameSelection({ onSelectFootball }: GameSelectionProps) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 py-5 border-b border-white/5">
        <RivalsLogo size="md" variant="full" className="text-white" />
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 min-h-[calc(100vh-80px)]">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-3 block">
            Choose Your Arena
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Select Your Game
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Pick your sport and start winning. More games coming soon.
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
          {/* Football - Active */}
          <GameCard
            title="Football"
            description="Virtual football betting with live matches, real-time odds, and instant settlement"
            icon={<IconFootball className="w-14 h-14" />}
            status="active"
            onClick={onSelectFootball}
            accentColor="emerald"
          />

          {/* Basketball - Coming Soon */}
          <GameCard
            title="Basketball"
            description="Fast-paced basketball action with quarter-by-quarter predictions"
            icon={
              <svg
                className="w-14 h-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20M12 2a10 10 0 0 0 0 20" />
                <path d="M2 12h20" />
              </svg>
            }
            status="coming_soon"
            accentColor="orange"
          />

          {/* Tennis - Coming Soon */}
          <GameCard
            title="Tennis"
            description="Set-by-set tennis betting with live match tracking and analysis"
            icon={
              <svg
                className="w-14 h-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2c-4 4-4 14 0 20M12 2c4 4 4 14 0 20" />
              </svg>
            }
            status="coming_soon"
            accentColor="yellow"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-slate-600 text-sm border-t border-white/5">
        More sports coming soon — stay tuned!
      </footer>
    </div>
  );
}

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "active" | "coming_soon";
  onClick?: () => void;
  accentColor: "emerald" | "orange" | "yellow";
}

const accentStyles = {
  emerald: {
    glow: "group-hover:shadow-emerald-500/20",
    border: "group-hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badge: "bg-emerald-500 text-white",
    cta: "text-emerald-400",
  },
  orange: {
    glow: "group-hover:shadow-orange-500/10",
    border: "group-hover:border-orange-500/20",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    badge: "bg-slate-700 text-slate-300",
    cta: "text-orange-400",
  },
  yellow: {
    glow: "group-hover:shadow-yellow-500/10",
    border: "group-hover:border-yellow-500/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    badge: "bg-slate-700 text-slate-300",
    cta: "text-yellow-400",
  },
};

function GameCard({
  title,
  description,
  icon,
  status,
  onClick,
  accentColor,
}: GameCardProps) {
  const isActive = status === "active";
  const styles = accentStyles[accentColor];

  return (
    <button
      onClick={isActive ? onClick : undefined}
      disabled={!isActive}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        "flex flex-col items-center p-8 text-center",
        "glass-card",
        isActive
          ? cn(
              "cursor-pointer hover:translate-y-[-6px]",
              "hover:shadow-2xl",
              styles.glow,
              styles.border,
            )
          : "cursor-not-allowed opacity-50",
      )}
    >
      {/* Badges */}
      {isActive ? (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Live
        </div>
      ) : (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold uppercase tracking-wider border border-slate-700">
          Coming Soon
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-5",
          styles.iconBg,
          styles.iconColor,
          isActive && "group-hover:scale-110 transition-transform duration-300",
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-[240px]">
        {description}
      </p>

      {/* CTA */}
      {isActive && (
        <div
          className={cn(
            "flex items-center gap-1 font-semibold text-sm transition-all group-hover:gap-2",
            styles.cta,
          )}
        >
          Play Now
          <IconChevronRight className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}

export default GameSelection;
