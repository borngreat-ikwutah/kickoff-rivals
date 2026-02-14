import { useState } from "react";
import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import { LEAGUES, TEAMS } from "../constants";
import {
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconUsers,
} from "./Icons";

interface AllianceSetupProps {
  apiUrl: string;
  onComplete: (data: { username: string; leagueId: string; teamId: string }) => void;
}

export function AllianceSetup({ apiUrl, onComplete }: AllianceSetupProps) {
  const [step, setStep] = useState<"username" | "league" | "team">("username");
  const [username, setUsername] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameSubmit = () => {
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (username.trim().length > 20) {
      setError("Username must be less than 20 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    setError(null);
    setStep("league");
  };

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId);
    setSelectedTeam(null);
    setStep("team");
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleComplete = () => {
    if (selectedLeague && selectedTeam) {
      onComplete({
        username: username.trim(),
        leagueId: selectedLeague,
        teamId: selectedTeam,
      });
    }
  };

  const handleBack = () => {
    if (step === "team") {
      setStep("league");
    } else if (step === "league") {
      setStep("username");
    }
  };

  const teams = selectedLeague ? TEAMS[selectedLeague] || [] : [];
  const selectedTeamData = teams.find((t) => t.id === selectedTeam);
  const selectedLeagueData = LEAGUES.find((l) => l.id === selectedLeague);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <RivalsLogo size="sm" variant="full" className="text-white" />
        {step !== "username" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <IconChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </header>

      {/* Progress */}
      <div className="relative z-10 px-6">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {["username", "league", "team"].map((s, index) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                step === s
                  ? "bg-primary"
                  : index <
                      ["username", "league", "team"].indexOf(step)
                    ? "bg-primary/50"
                    : "bg-slate-700"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Username Step */}
        {step === "username" && (
          <div className="max-w-md w-full animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/20 text-primary">
                <IconUsers className="w-12 h-12" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Choose Your Name
            </h1>
            <p className="text-slate-400 text-center mb-8">
              This is how other players will see you
            </p>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  maxLength={20}
                  className={cn(
                    "input w-full h-14 text-lg bg-slate-800 border-slate-600",
                    "focus:border-primary focus:ring-primary",
                    "placeholder:text-slate-500 text-white"
                  )}
                />
                {error && (
                  <p className="text-destructive text-sm mt-2">{error}</p>
                )}
                <p className="text-slate-500 text-xs mt-2">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <button
                onClick={handleUsernameSubmit}
                disabled={username.trim().length < 3}
                className={cn(
                  "btn btn-primary w-full h-12 font-semibold",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Continue
                <IconChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* League Step */}
        {step === "league" && (
          <div className="max-w-md w-full animate-fade-in">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Choose Your League
            </h1>
            <p className="text-slate-400 text-center mb-8">
              Pick the league you want to support
            </p>

            <div className="space-y-3">
              {LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border transition-all",
                    "flex items-center justify-between",
                    "hover:border-primary hover:bg-primary/5",
                    selectedLeague === league.id
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
                        league.id === "l1"
                          ? "bg-purple-600"
                          : league.id === "l2"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                      )}
                    >
                      {league.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">
                        {league.name}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {TEAMS[league.id]?.length || 0} teams
                      </div>
                    </div>
                  </div>
                  <IconChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Team Step */}
        {step === "team" && selectedLeague && (
          <div className="max-w-md w-full animate-fade-in">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Choose Your Team
            </h1>
            <p className="text-slate-400 text-center mb-2">
              {selectedLeagueData?.name}
            </p>
            <p className="text-slate-500 text-sm text-center mb-6">
              You'll earn bonus rewards when your team wins!
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-6">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    "flex flex-col items-center gap-2",
                    "hover:border-primary",
                    selectedTeam === team.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/50"
                      : "border-slate-700 bg-slate-800/50"
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <span className="text-white text-sm font-medium text-center">
                    {team.name}
                  </span>
                  {selectedTeam === team.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedTeam && (
              <button
                onClick={handleComplete}
                className="btn btn-primary w-full h-12 font-semibold"
              >
                Join {selectedTeamData?.name}
                <IconChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-slate-500 text-xs">
        {step === "username" && "Step 1 of 3"}
        {step === "league" && "Step 2 of 3"}
        {step === "team" && "Step 3 of 3"}
      </footer>
    </div>
  );
}

export default AllianceSetup;
