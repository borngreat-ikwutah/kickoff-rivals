import { cn } from "../lib/utils";
import { LeagueEntry, UserStats } from "../types";
import { LEAGUES } from "../constants";
import { IconTrophy, IconChevronDown, IconUsers, IconStar } from "./Icons";

interface LeagueTableProps {
  entries: LeagueEntry[];
  currentLeagueId: string;
  onLeagueChange: (leagueId: string) => void;
  userStats: UserStats;
}

export function LeagueTable({
  entries,
  currentLeagueId,
  onLeagueChange,
  userStats,
}: LeagueTableProps) {
  const currentLeague = LEAGUES.find((l) => l.id === currentLeagueId);
  const sortedEntries = [...entries].sort((a, b) => {
    // Sort by points, then goal difference, then goals scored
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  const isUserAlliance = (teamId: string) => {
    return (
      userStats.allianceLeagueId === currentLeagueId &&
      userStats.allianceTeamId === teamId
    );
  };

  const getPositionStyle = (position: number) => {
    if (position === 1) return "bg-yellow-500/20 text-yellow-400";
    if (position === 2) return "bg-slate-400/20 text-slate-300";
    if (position === 3) return "bg-amber-600/20 text-amber-500";
    return "bg-slate-700/50 text-slate-400";
  };

  return (
    <div className="space-y-4">
      {/* League Selector */}
      <div className="card p-4">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Select League
        </label>
        <div className="relative">
          <select
            value={currentLeagueId}
            onChange={(e) => onLeagueChange(e.target.value)}
            className={cn(
              "input w-full h-12 pr-10 appearance-none cursor-pointer",
              "bg-card border-border text-foreground font-semibold"
            )}
          >
            {LEAGUES.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
          <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* User Alliance Banner */}
      {userStats.allianceLeagueId === currentLeagueId &&
        userStats.allianceTeamId && (
          <div className="card p-4 bg-primary/10 border-primary/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <IconUsers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Your Alliance
                </p>
                <p className="text-xs text-muted-foreground">
                  Supporting{" "}
                  {sortedEntries.find(
                    (e) => e.teamId === userStats.allianceTeamId
                  )?.teamName || "Unknown Team"}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Table Header */}
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <IconTrophy className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">{currentLeague?.name}</h2>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[40px_1fr_40px_40px_40px_40px_50px] gap-1 px-4 py-2 bg-muted/30 text-xs font-bold text-muted-foreground border-b border-border">
          <div className="text-center">#</div>
          <div>Team</div>
          <div className="text-center">P</div>
          <div className="text-center">W</div>
          <div className="text-center">D</div>
          <div className="text-center">L</div>
          <div className="text-center">Pts</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {sortedEntries.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <IconTrophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No standings yet</p>
              <p className="text-sm">Matches need to be played first</p>
            </div>
          ) : (
            sortedEntries.map((entry, index) => {
              const position = index + 1;
              const isAlliance = isUserAlliance(entry.teamId);
              const goalDiff = entry.goalsFor - entry.goalsAgainst;

              return (
                <div
                  key={entry.teamId}
                  className={cn(
                    "grid grid-cols-[40px_1fr_40px_40px_40px_40px_50px] gap-1 px-4 py-3 items-center transition-colors",
                    "hover:bg-muted/30",
                    isAlliance && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {/* Position */}
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        getPositionStyle(position)
                      )}
                    >
                      {position}
                    </span>
                  </div>

                  {/* Team */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: entry.color }}
                    >
                      {entry.teamName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "font-semibold text-sm truncate",
                            isAlliance ? "text-primary" : "text-foreground"
                          )}
                        >
                          {entry.teamName}
                        </span>
                        {isAlliance && (
                          <IconStar className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        GD: {goalDiff > 0 ? "+" : ""}
                        {goalDiff}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-center text-sm text-muted-foreground">
                    {entry.played}
                  </div>
                  <div className="text-center text-sm text-green-500 font-medium">
                    {entry.won}
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {entry.drawn}
                  </div>
                  <div className="text-center text-sm text-red-400 font-medium">
                    {entry.lost}
                  </div>
                  <div className="text-center text-sm font-bold text-foreground">
                    {entry.points}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer */}
        {sortedEntries.length > 0 && (
          <div className="px-4 py-3 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>P = Played, W = Won, D = Drawn, L = Lost</span>
              <span>GD = Goal Difference</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                getPositionStyle(1)
              )}
            >
              1
            </span>
            <span className="text-sm text-muted-foreground">Champion</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                getPositionStyle(2)
              )}
            >
              2
            </span>
            <span className="text-sm text-muted-foreground">Runner-up</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                getPositionStyle(3)
              )}
            >
              3
            </span>
            <span className="text-sm text-muted-foreground">3rd Place</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeagueTable;
