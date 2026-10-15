import { getWinners, hasSevenStack, scoreHand } from "./scoring";
import { Player } from "./types";

// One line of the results board.
export type Row = {
  id: string;
  name: string;
  bot?: Player["bot"];
  status: Player["status"];
  roundPoints: number;   // points earned this round (0 when busted)
  before: number;        // total before this round
  total: number;         // total after this round is banked
  rank: number;          // 1 = top. Players with the same total share a rank.
  sevenStack: boolean;   // completed a Seven Stack this round
};

export type RoundResults = {
  rows: Row[];           // best total first; ties keep seat order
  gameEnds: boolean;     // exactly one player has 200+ and leads: this was the last round
  tiedAtTop: boolean;    // 200+ reached but the leaders tie, so another round is played
};

// Players with the same total share a rank (1, 2, 2, 4).
function rankRows<T extends { total: number }>(sorted: T[]): number[] {
  return sorted.map((r, i) => sorted.findIndex((o) => o.total === r.total) + 1);
}

// The board shown when a round ends, BEFORE the round's points are banked
// (the session banks them when the player presses "Next round").
export function roundResults(players: Player[]): RoundResults {
  const rows = players
    .map((p, seat) => ({
      seat,
      id: p.id,
      name: p.name,
      ...(p.bot ? { bot: p.bot } : {}),
      status: p.status,
      roundPoints: scoreHand(p),
      before: p.totalScore,
      total: p.totalScore + scoreHand(p),
      sevenStack: hasSevenStack(p),
    }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat);
  const ranks = rankRows(rows);

  const afterBanking = players.map((p) => ({ ...p, totalScore: p.totalScore + scoreHand(p) }));
  const winners = getWinners(afterBanking);

  return {
    rows: rows.map(({ seat: _seat, ...r }, i) => ({ ...r, rank: ranks[i] })),
    gameEnds: winners.length === 1,
    tiedAtTop: winners.length > 1,
  };
}

// The final standings once the game is over (totals are already banked).
export function finalStandings(players: Player[]): { id: string; name: string; bot?: Player["bot"]; total: number; rank: number }[] {
  const rows = players
    .map((p, seat) => ({ seat, id: p.id, name: p.name, ...(p.bot ? { bot: p.bot } : {}), total: p.totalScore }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat);
  const ranks = rankRows(rows);
  return rows.map(({ seat: _seat, ...r }, i) => ({ ...r, rank: ranks[i] }));
}
