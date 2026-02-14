
import { Match, MatchResult, MatchEvent } from "../types";

/**
 * Deterministic HMAC-like Hash
 * Simulates crypto.createHmac('sha256', key).update(data)
 */
const hmacDeterministic = (key: string, data: string): number => {
  const combined = `${key}:${data}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Standardized float between 0 and 1
  const x = Math.abs(Math.sin(hash) * 10000);
  return x - Math.floor(x);
};

export const generateMatchResult = (match: Match, serverSeed: string): MatchResult => {
  const clientSeed = match.roundHash;
  const blockHash = match.blockHash || '0x00000000000000000000';
  const homeStr = match.homeTeam.strength;
  const awayStr = match.awayTeam.strength;

  let homeScore = 0;
  let awayScore = 0;
  const events: MatchEvent[] = [];

  events.push({ minute: 1, description: "Kick-off!", type: 'whistle' });

  for (let m = 1; m <= 90; m++) {
    // HMAC(ServerSeed, ClientSeed : BlockHash : Minute)
    const payload = `${clientSeed}:${blockHash}:${m}`;
    const rand = hmacDeterministic(serverSeed, payload);

    // Momentum logic
    let homeMomentum = homeScore < awayScore ? 1.15 : 1.0;
    let awayMomentum = awayScore < homeScore ? 1.15 : 1.0;

    const scoringChance = 0.042;

    if (rand < scoringChance) {
      const scorerRand = hmacDeterministic(serverSeed, `${payload}:scorer`);
      const totalStrength = (homeStr * homeMomentum) + (awayStr * awayMomentum);
      const homeProb = (homeStr * homeMomentum) / totalStrength;

      if (scorerRand < homeProb) {
        homeScore++;
        events.push({ minute: m, description: `GOAL! ${match.homeTeam.name}`, type: 'goal', teamId: match.homeTeam.id });
      } else {
        awayScore++;
        events.push({ minute: m, description: `GOAL! ${match.awayTeam.name}`, type: 'goal', teamId: match.awayTeam.id });
      }
    }
    else if (rand > 0.987) {
      events.push({ minute: m, description: `Injury timeout.`, type: 'injury' });
    }
    else if (rand > 0.970) {
      const cardRand = hmacDeterministic(serverSeed, `${payload}:card:${Date.now()}`);
      const type = cardRand > 0.85 ? 'red_card' : 'yellow_card';
      const team = cardRand > 0.5 ? match.homeTeam : match.awayTeam;
      events.push({ minute: m, description: type === 'red_card' ? `RED CARD! ${team.name}` : `Yellow Card: ${team.name}`, type, teamId: team.id });
    }
    else if (rand > 0.945 && rand < 0.970) {
      const chanceRand = hmacDeterministic(serverSeed, `${payload}:chance`);
      events.push({ minute: m, description: chanceRand > 0.5 ? `${match.homeTeam.name} near miss!` : `${match.awayTeam.name} near miss!`, type: 'chance' });
    }
  }

  events.push({ minute: 90, description: "Full Time", type: 'whistle' });

  return {
    homeScore,
    awayScore,
    events,
    summary: `FT: ${homeScore} - ${awayScore}`,
    serverSeed // Reveal seed for auditor verification
  };
};

export const calculateOdds = (homeStr: number, awayStr: number): Match['odds'] => {
  const diff = homeStr - awayStr;
  const homeProb = 0.33 + (diff / 160);
  const awayProb = 0.33 - (diff / 160);
  const drawProb = 0.34;

  const margin = 0.10; // 10% House Edge
  const clamp = (val: number) => Math.min(Math.max(val, 1.15), 45.0);

  return {
    home: Number(clamp(1 / (homeProb + (margin / 3))).toFixed(2)),
    draw: Number(clamp(1 / (drawProb + (margin / 3))).toFixed(2)),
    away: Number(clamp(1 / (awayProb + (margin / 3))).toFixed(2)),
    gg: 1.75,    // Both Teams to Score
    nogg: 2.10   // Both Teams NOT to Score
  };
};
