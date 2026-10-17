import { Game } from "./session";

// Your record on this phone. Only finished games count: leaving a game early does not.
export type Stats = {
  games: number;        // games played to the end
  wins: number;
  bestRound: number;    // most points in one round
  sevenStacks: number;  // Seven Stacks made, over all games
  topScore: number;     // highest final score
};

export const emptyStats = (): Stats => ({ games: 0, wins: 0, bestRound: 0, sevenStacks: 0, topScore: 0 });

// How one finished game went for one player.
export type GameResult = { won: boolean; bestRound: number; sevenStacks: number; finalScore: number };

// Reads a finished game from the point of view of the player in `seat`. Null if the game is not over.
export function resultOf(game: Game, seat: number): GameResult | null {
  const me = game.round.players[seat];
  if (game.phase !== "gameOver" || !me) return null;
  return {
    won: game.winners.some((w) => w.id === me.id),
    bestRound: game.best[seat]?.points ?? 0,
    sevenStacks: game.stacks[seat] ?? 0,
    finalScore: me.totalScore,
  };
}

export function recordGame(stats: Stats, result: GameResult): Stats {
  return {
    games: stats.games + 1,
    wins: stats.wins + (result.won ? 1 : 0),
    bestRound: Math.max(stats.bestRound, result.bestRound),
    sevenStacks: stats.sevenStacks + result.sevenStacks,
    topScore: Math.max(stats.topScore, result.finalScore),
  };
}

// Whole percent of games won, 0 when nothing has been played yet.
export function winRate(stats: Stats): number {
  return stats.games === 0 ? 0 : Math.round((stats.wins / stats.games) * 100);
}

const count = (x: unknown): number | null =>
  typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1_000_000 ? Math.floor(x) : null;

// Whatever was stored, as stats the app can trust. Each number is checked on its own.
export function parseStats(raw: unknown): Stats {
  const fallback = emptyStats();
  if (typeof raw !== "object" || raw === null) return fallback;
  const r = raw as Record<string, unknown>;
  const stats: Stats = {
    games: count(r.games) ?? fallback.games,
    wins: count(r.wins) ?? fallback.wins,
    bestRound: count(r.bestRound) ?? fallback.bestRound,
    sevenStacks: count(r.sevenStacks) ?? fallback.sevenStacks,
    topScore: count(r.topScore) ?? fallback.topScore,
  };
  // You cannot win more games than you played.
  if (stats.wins > stats.games) stats.wins = stats.games;
  return stats;
}
