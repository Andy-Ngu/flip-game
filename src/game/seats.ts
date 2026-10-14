import { PlayerSetup } from "./session";
import { BotLevel } from "./types";

// One seat on the setup screen: a human, or a computer player at some level.
export type SeatKind = "human" | BotLevel;
export type Seat = { name: string; kind: SeatKind };

export const MIN_SEATS = 3; // the rulebook says Flip 7 is for 3 or more players
export const MAX_SEATS = 8;

const BOT_NAMES = ["Robo", "Bolt", "Cleo", "Dot", "Echo", "Fizz", "Gus", "Hex"];

// One human against two computer players.
export function defaultSeats(): Seat[] {
  return [
    { name: "You", kind: "human" },
    { name: "Robo", kind: "hard" },
    { name: "Bolt", kind: "medium" },
  ];
}

// Add a medium computer player with the next unused name.
export function addSeat(seats: Seat[]): Seat[] {
  if (seats.length >= MAX_SEATS) return seats;
  const used = new Set(seats.map((s) => s.name.trim().toLowerCase()));
  const name = BOT_NAMES.find((n) => !used.has(n.toLowerCase())) ?? `Player ${seats.length + 1}`;
  return [...seats, { name, kind: "medium" }];
}

export function removeSeat(seats: Seat[], index: number): Seat[] {
  if (seats.length <= MIN_SEATS) return seats;
  return seats.filter((_, i) => i !== index);
}

export function updateSeat(seats: Seat[], index: number, change: Partial<Seat>): Seat[] {
  return seats.map((s, i) => (i === index ? { ...s, ...change } : s));
}

// Why the game can't start yet, or null if it can.
export function seatProblem(seats: Seat[]): string | null {
  if (seats.length < MIN_SEATS) return `You need at least ${MIN_SEATS} players.`;
  const names = seats.map((s) => s.name.trim().toLowerCase());
  if (names.some((n) => n === "")) return "Every player needs a name.";
  if (new Set(names).size !== names.length) return "Each player needs a different name.";
  return null;
}

// Turn the setup screen's seats into what newGame expects.
export function toSetup(seats: Seat[]): PlayerSetup[] {
  return seats.map((s) =>
    s.kind === "human" ? { name: s.name.trim() } : { name: s.name.trim(), bot: s.kind }
  );
}
