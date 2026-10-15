import { uniqueNumberCount } from "./scoring";
import { Game } from "./session";
import { Card, Player } from "./types";

// Things that can happen in one move, worked out by comparing the game before
// and after. Haptics and animations react to these instead of poking around
// inside the game rules.
export type GameEvent =
  | { kind: "card"; player: number; card: Card }
  | { kind: "saved"; player: number }   // a Shield was used up
  | { kind: "stay"; player: number }
  | { kind: "timedOut"; player: number }
  | { kind: "bust"; player: number }
  | { kind: "sevenStack"; player: number }
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
  if (prev.phase !== "playing") return [{ kind: "newRound" }];

  const before = prev.round.players;
  const after = next.round.players;
  if (before.length !== after.length) return [{ kind: "newRound" }];

  const events: GameEvent[] = [];
  after.forEach((q, i) => {
    const p = before[i];

    // A used Shield leaves the hand, so count it as removed and add it back
    // when working out how many cards arrived.
    const shieldUsed = p.hand.some(isShield) && !q.hand.some(isShield) && q.hand.length < p.hand.length;
    const removed = shieldUsed ? 1 : 0;
    const added = q.hand.length - p.hand.length + removed;
    for (const card of q.hand.slice(q.hand.length - Math.max(0, added))) {
      events.push({ kind: "card", player: i, card });
    }
    if (shieldUsed && q.status !== "busted") events.push({ kind: "saved", player: i });

    if (p.status !== q.status) {
      if (q.status === "busted") events.push({ kind: "bust", player: i });
      else if (q.status === "timedOut") events.push({ kind: "timedOut", player: i });
      else if (q.status === "stayed") events.push({ kind: "stay", player: i });
    }
    if (uniqueNumberCount(q) >= 7 && uniqueNumberCount(p) < 7) events.push({ kind: "sevenStack", player: i });
  });
  return events;
}

const INTENSITY: Feel[] = ["tick", "light", "medium", "warning", "heavy", "success", "error"];

// The single strongest feeling for a batch of events, or null if nothing happened.
// A human's own bust is the strongest warning; a computer's is milder.
export function feelFor(events: GameEvent[], players: Player[]): Feel | null {
  const human = (i: number) => players[i]?.bot === undefined;
  const feels: Feel[] = events.map((e): Feel => {
    switch (e.kind) {
      case "gameOver": return e.winners.some(human) ? "success" : "warning";
      case "sevenStack": return human(e.player) ? "success" : "heavy";
      case "bust": return human(e.player) ? "error" : "warning";
      case "timedOut": return "heavy";
      case "saved": return "medium";
      case "stay": return "light";
      case "newRound": return "light";
      case "card": return "tick";
    }
  });
  if (feels.length === 0) return null;
  return feels.reduce((a, b) => (INTENSITY.indexOf(b) > INTENSITY.indexOf(a) ? b : a));
}
