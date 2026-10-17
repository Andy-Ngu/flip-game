import { isDuplicate } from "./rules";
import { uniqueNumberCount } from "./scoring";
import { Game } from "./session";
import { deckLow, leaderOf, projectedTotal } from "./moments";
import { Card, Player } from "./types";

// Things that can happen in one move, worked out by comparing the game before
// and after. Haptics, sounds and animations react to these instead of poking around
// inside the game rules.
export type GameEvent =
  | { kind: "card"; player: number; card: Card; count: number } // count: how many cards that player holds right after this one
  | { kind: "saved"; player: number; shield: Card; duplicate: Card | null } // a Shield was used up, blocking this duplicate
  | { kind: "stay"; player: number }
  | { kind: "timedOut"; player: number }
  | { kind: "bust"; player: number }
  | { kind: "sevenStack"; player: number }
  | { kind: "reshuffle" }                      // the draw pile ran out and the discard pile became the new deck
  | { kind: "deckLow"; left: number }          // the draw pile just got short
  | { kind: "leadChange"; from: number; to: number; points: number; fromPoints: number } // `to` just passed `from`
  | { kind: "newRound" }
  | { kind: "gameOver"; winners: number[] };

// How a move should feel in the hand, from the faintest tap to the strongest buzz.
export type Feel = "tick" | "light" | "medium" | "warning" | "heavy" | "success" | "error";

const isShield = (c: Card): boolean => c.kind === "action" && c.action === "shield";

export function diffEvents(prev: Game, next: Game): GameEvent[] {
  if (prev === next) return [];

  if (next.phase === "gameOver" && prev.phase !== "gameOver") {
    const players = next.round.players;
    const winners = players.map((_, i) => i).filter((i) => next.winners.some((w) => w.id === players[i].id));
    return [{ kind: "gameOver", winners }];
  }

  // Scoring a round, or starting a fresh game, replaces every hand at once.
  // Changes that are not a move (a computer taking over a seat, say) are not a new round.
  if (prev.phase !== "playing") {
    return next.phase === "playing" || next.roundNo !== prev.roundNo ? [{ kind: "newRound" }] : [];
  }

  const before = prev.round.players;
  const after = next.round.players;
  if (before.length !== after.length) return [{ kind: "newRound" }];

  const events: GameEvent[] = [];
  if (prev.round.deck.seed !== next.round.deck.seed) events.push({ kind: "reshuffle" });

  after.forEach((q, i) => {
    const p = before[i];

    // A used Shield leaves the hand, so count it as removed and add it back
    // when working out how many cards arrived.
    const shieldUsed = p.hand.some(isShield) && !q.hand.some(isShield) && q.hand.length < p.hand.length;
    const removed = shieldUsed ? 1 : 0;
    const added = Math.max(0, q.hand.length - p.hand.length + removed);
    const firstNew = q.hand.length - added;
    for (let k = 0; k < added; k++) {
      events.push({ kind: "card", player: i, card: q.hand[firstNew + k], count: firstNew + k + 1 });
    }
    if (shieldUsed && q.status !== "busted") {
      events.push({ kind: "saved", player: i, shield: p.hand.find(isShield)!, duplicate: blockedCard(prev, next, p) });
    }

    if (p.status !== q.status) {
      if (q.status === "busted") events.push({ kind: "bust", player: i });
      else if (q.status === "timedOut") events.push({ kind: "timedOut", player: i });
      else if (q.status === "stayed") events.push({ kind: "stay", player: i });
    }
    if (uniqueNumberCount(q) >= 7 && uniqueNumberCount(p) < 7) events.push({ kind: "sevenStack", player: i });
  });

  // The pile got short: a one-time warning each time it crosses the line.
  const was = prev.round.deck.drawPile.length;
  const now = next.round.deck.drawPile.length;
  if (deckLow(now) && !deckLow(was) && now < was) events.push({ kind: "deckLow", left: now });

  // Someone passed the leader.
  const lead = leaderOf(before);
  const leadNow = leaderOf(after);
  if (lead !== null && leadNow !== null && lead !== leadNow) {
    events.push({ kind: "leadChange", from: lead, to: leadNow, points: projectedTotal(after[leadNow]), fromPoints: projectedTotal(after[lead]) });
  }
  return events;
}

// The duplicate that a Shield blocked. It never joins the hand, so look for it among the cards
// that just went to the discard pile: the last number card matching one the player holds.
// If the discard pile was reshuffled during the move we can't tell, and return null.
function blockedCard(prev: Game, next: Game, before: Player): Card | null {
  const was = prev.round.deck.discardPile.length;
  const now = next.round.deck.discardPile;
  if (now.length <= was) return null;
  const added = now.slice(was);
  for (let k = added.length - 1; k >= 0; k--) {
    if (isDuplicate(before.hand, added[k])) return added[k];
  }
  return null;
}

const INTENSITY: Feel[] = ["tick", "light", "medium", "warning", "heavy", "success", "error"];

// Your own cards get a little firmer the more you have drawn in a row: the buzz climbs with your hand.
export function streakFeel(count: number): Feel {
  return count >= 5 ? "medium" : count >= 3 ? "light" : "tick";
}

// The single strongest feeling for a batch of events, or null if nothing happened.
// `me` is the seat of the person holding the phone. Their own bust is the strongest warning;
// other players' busts are milder.
export function feelFor(events: GameEvent[], me: number): Feel | null {
  const feels: Feel[] = events.map((e): Feel => {
    switch (e.kind) {
      case "gameOver": return e.winners.includes(me) ? "success" : "warning";
      case "sevenStack": return e.player === me ? "success" : "heavy";
      case "bust": return e.player === me ? "error" : "warning";
      case "timedOut": return "heavy";
      case "saved": return "medium";
      case "stay": return "light";
      case "newRound": return "light";
      case "reshuffle": return "medium";
      case "deckLow": return "light";
      case "leadChange": return e.to === me ? "success" : "light";
      case "card": return e.player === me ? streakFeel(e.count) : "tick";
    }
  });
  if (feels.length === 0) return null;
  return feels.reduce((a, b) => (INTENSITY.indexOf(b) > INTENSITY.indexOf(a) ? b : a));
}
