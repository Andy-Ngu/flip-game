// Small builders shared by the test suites. Nothing in the app imports this file.
import { Game } from "./session";
import { Card, Player } from "./types";

export const num = (value: number): Card => ({ kind: "number", value });
export const timeOut: Card = { kind: "action", action: "timeOut" };
export const drawThree: Card = { kind: "action", action: "drawThree" };
export const shield: Card = { kind: "action", action: "shield" };

export const mk = (id: string, hand: Card[] = [], status: Player["status"] = "playing", extra: Partial<Player> = {}): Player =>
  ({ id, name: id, hand, totalScore: 0, status, ...extra });

// A game in progress, built from prepared players and a prepared draw pile. Player 0 is to act.
export function gameFrom(players: Player[], drawPile: Card[], extra: Partial<Game> = {}): Game {
  const n = players.length;
  return {
    round: { players, deck: { drawPile, discardPile: [] } },
    dealer: 0, current: 0, phase: "playing", winners: [], pending: null, choices: [], resume: null,
    target: 200, roundNo: 1,
    quiet: Array(n).fill(0), cover: Array(n).fill(false),
    best: Array.from({ length: n }, () => ({ points: 0, sevenStack: false })),
    stacks: Array(n).fill(0),
    ...extra,
  };
}
