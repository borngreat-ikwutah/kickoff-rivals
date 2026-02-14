import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { Match, MatchResult } from "../types";
import { IconX, IconPlay, IconPause, IconClock } from "./Icons";

interface SimulationScreenProps {
  match: Match;
  result: MatchResult;
  currentMinute: number;
  onFinish: () => void;
}

export function SimulationScreen({
  match,
  result,
  currentMinute,
  onFinish,
}: SimulationScreenProps) {
  const [displayedEvents, setDisplayedEvents] = useState<typeof result.events>(
    []
  );
  const [isPaused, setIsPaused] = useState(false);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  // Filter events up to current minute
  useEffect(() => {
    const eventsToShow = result.events.filter(
      (event) => event.minute <= currentMinute
    );
    setDisplayedEvents(eventsToShow);
  }, [currentMinute, result.events]);

  // Auto-scroll to latest event
  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop =
        eventsContainerRef.current.scrollHeight;
    }
  }, [displayedEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal":
        return "⚽";
      case "yellow_card":
        return "🟨";
      case "red_card":
        return "🟥";
      case "whistle":
        return "📣";
      case "injury":
        return "🏥";
      case "chance":
        return "💨";
      case "near_miss":
        return "😮";
      case "penalty_shout":
        return "❗";
      default:
        return "•";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "goal":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "yellow_card":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "red_card":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "whistle":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "injury":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  const isMatchFinished = currentMinute >= 90;
  const homeScore = match.currentScore?.home ?? result.homeScore;
  const awayScore = match.currentScore?.away ?? result.awayScore;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
              isMatchFinished
                ? "bg-slate-600 text-white"
                : "bg-red-500 text-white animate-pulse"
            )}
          >
            {isMatchFinished ? (
              <>FT</>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </>
            )}
          </div>
          <span className="text-white font-mono text-lg">
            {currentMinute > 90 ? "90" : currentMinute}'
          </span>
        </div>

        <button
          onClick={onFinish}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <IconX className="w-5 h-5" />
        </button>
      </header>

      {/* Pitch/Score Area */}
      <div className="bg-pitch-pattern p-6">
        <div className="max-w-md mx-auto">
          {/* Teams & Score */}
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ backgroundColor: match.homeTeam.color }}
              >
                {match.homeTeam.name.charAt(0)}
              </div>
              <span className="text-white font-semibold text-sm text-center">
                {match.homeTeam.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 px-6">
              <span className="text-5xl font-bold text-white font-mono">
                {homeScore}
              </span>
              <span className="text-2xl text-slate-400">-</span>
              <span className="text-5xl font-bold text-white font-mono">
                {awayScore}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ backgroundColor: match.awayTeam.color }}
              >
                {match.awayTeam.name.charAt(0)}
              </div>
              <span className="text-white font-semibold text-sm text-center">
                {match.awayTeam.name}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  isMatchFinished ? "bg-slate-500" : "bg-primary"
                )}
                style={{ width: `${Math.min((currentMinute / 90) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-400 font-mono">
              <span>0'</span>
              <span>45'</span>
              <span>90'</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div
        ref={eventsContainerRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
      >
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Match Events
          </h3>

          {displayedEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <IconClock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Waiting for events...</p>
            </div>
          ) : (
            displayedEvents.map((event, index) => (
              <div
                key={`${event.minute}-${index}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all animate-slide-up",
                  getEventColor(event.type)
                )}
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">
                      {event.minute}'
                    </span>
                    <span className="text-sm">{event.description}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-700">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            {isMatchFinished ? (
              <span className="text-white font-semibold">
                Final Score: {result.homeScore} - {result.awayScore}
              </span>
            ) : (
              <span>Match in progress...</span>
            )}
          </div>

          <button
            onClick={onFinish}
            className={cn(
              "btn h-10 px-6",
              isMatchFinished ? "btn-primary" : "btn-outline"
            )}
          >
            {isMatchFinished ? "Close" : "Exit"}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default SimulationScreen;
