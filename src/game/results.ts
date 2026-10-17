import { DEFAULT_TARGET, getWinners, hasSevenStack, scoreHand } from "./scoring";
import { Card, Look, Player } from "./types";

// One line of the results board.
export type Row = {
  seat: number;          // where the player sits at the table
  id: string;
  name: string;
  bot?: Player["bot"];
  look?: Look;
  status: Player["status"];
  roundPoints: number;   // points earned this round (0 when busted)
  before: number;        // total before this round
  total: number;         // total after this round is banked
  rank: number;          // 1 = top. Players with the same total share a rank.
  sevenStack: boolean;   // completed a Seven Stack this round
  line: string;          // what happened to them this round, in a few words
};

export type RoundResults = {
  rows: Row[];           // best total first; ties keep seat order
  gameEnds: boolean;     // exactly one player has reached the target and leads: this was the last round
  tiedAtTop: boolean;    // the target was reached but the leaders tie, so another round is played
};

// Players with the same total share a rank (1, 2, 2, 4).
function rankRows<T extends { total: number }>(sorted: T[]): number[] {
  return sorted.map((r) => sorted.findIndex((o) => o.total === r.total) + 1);
}

const cards = (n: number) => (n === 1 ? "1 card" : `${n} cards`);

// Where in the hand the card that caused a bust sits: the second copy of a number. A busted player can
// hold cards after it (a Time Out or Draw Three that was still being played), so it is not always last.
export function duplicateIndex(hand: Card[]): number | null {
  const seen = new Set<number>();
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    if (c.kind !== "number") continue;
    if (seen.has(c.value)) return i;
    seen.add(c.value);
  }
  return null;
}

// The number that was drawn twice, if the hand is a bust.
function duplicateValue(p: Player): number | null {
  const at = duplicateIndex(p.hand);
  const card = at === null ? undefined : p.hand[at];
  return card && card.kind === "number" ? card.value : null;
}

// What happened to a player this round, in a few words, for the results board. Only the main fact is
// said: how many points they earned is already in the "+N" beside it, so the Double Score, the bonus and
// what a Time Out leaves them with are not repeated.
export function describeRound(p: Player, players: Player[]): string {
  if (hasSevenStack(p)) return "Made a Seven Stack (+15)";

  if (p.status === "busted") {
    const dup = duplicateValue(p);
    return dup === null ? "Busted" : `Busted on a second ${dup}`;
  }

  if (p.status === "timedOut") {
    const by = p.timedOutBy === undefined ? undefined : players[p.timedOutBy];
    if (!by) return "Timed out";
    return by.id === p.id ? "Timed themselves out" : `Timed out by ${by.name}`;
  }

  if (p.status === "playing") return "Still in when the round ended";

  const n = p.hand.length;
  if (p.autoStayed) return `Time ran out, stayed with ${cards(n)}`;
  return n <= 2 ? `Stayed early with ${cards(n)}` : `Stayed with ${cards(n)}`;
}

// The board shown when a round ends, BEFORE the round's points are banked
// (the session banks them when the player presses "Next round").
export function roundResults(players: Player[], target: number = DEFAULT_TARGET): RoundResults {
  const rows = players
    .map((p, seat) => ({
      seat,
      id: p.id,
      name: p.name,
      ...(p.bot ? { bot: p.bot } : {}),
      ...(p.look ? { look: p.look } : {}),
      status: p.status,
      roundPoints: scoreHand(p),
      before: p.totalScore,
      total: p.totalScore + scoreHand(p),
      sevenStack: hasSevenStack(p),
      line: describeRound(p, players),
    }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat);
  const ranks = rankRows(rows);

  const afterBanking = players.map((p) => ({ ...p, totalScore: p.totalScore + scoreHand(p) }));
  const winners = getWinners(afterBanking, target);

  return {
    rows: rows.map((r, i) => ({ ...r, rank: ranks[i] })),
    gameEnds: winners.length === 1,
    tiedAtTop: winners.length > 1,
  };
}

export type Standing = { seat: number; id: string; name: string; bot?: Player["bot"]; look?: Look; total: number; rank: number };

// The final standings once the game is over (totals are already banked).
export function finalStandings(players: Player[]): Standing[] {
  const rows = players
    .map((p, seat) => ({ seat, id: p.id, name: p.name, ...(p.bot ? { bot: p.bot } : {}), ...(p.look ? { look: p.look } : {}), total: p.totalScore }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat);
  const ranks = rankRows(rows);
  return rows.map((r, i) => ({ ...r, rank: ranks[i] }));
}

// ---------- the start of a round ----------

// 1 = plays first. The player after the dealer goes first, then round the table.
export function turnPosition(seat: number, dealer: number, seats: number): number {
  return ((((seat - dealer - 1) % seats) + seats) % seats) + 1;
}

// 1st, 2nd, 3rd, 4th ...
export function ordinal(n: number): string {
  const last = n % 100;
  if (last >= 11 && last <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
}

export type StartRow = {
  seat: number;
  name: string;
  bot?: Player["bot"];
  look?: Look;
  score: number;   // the total so far
  plays: number;   // 1 = plays first this round
};

// The board shown at the start of a round: everyone with their score and when they play,
// best score first. Players with the same score are listed in the order they play.
export function startRows(players: Player[], dealer: number): StartRow[] {
  return players
    .map((p, seat): StartRow => ({
      seat,
      name: p.name,
      ...(p.bot ? { bot: p.bot } : {}),
      ...(p.look ? { look: p.look } : {}),
      score: p.totalScore,
      plays: turnPosition(seat, dealer, players.length),
    }))
    .sort((a, b) => b.score - a.score || a.plays - b.plays);
}
