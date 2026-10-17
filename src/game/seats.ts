import { shuffle } from "./deck";
import { ClockSeconds, DEFAULT_CLOCK, isClockSeconds } from "./clock";
import { COLORS, ROBOT } from "./profile";
import { DEFAULT_TARGET, isTarget, Target } from "./scoring";
import { PlayerSetup } from "./session";
import { BotLevel, Look } from "./types";

// A table is 3 to 8 seats. You take the first seat and computer players fill the rest.
// (Online tables will have several people; the same limits apply.)
export const MIN_SEATS = 3;
export const MAX_SEATS = 8;
export const DEFAULT_SEATS = 6;
export const SEAT_COUNTS = [3, 4, 5, 6, 7, 8] as const;

export function isSeatCount(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= MIN_SEATS && x <= MAX_SEATS;
}

export const BOT_LEVELS: BotLevel[] = ["easy", "medium", "hard"];
export const DEFAULT_BOT_LEVEL: BotLevel = "medium";
export const BOT_LEVEL_LABEL: Record<BotLevel, string> = { easy: "Easy", medium: "Normal", hard: "Hard" };

export const isBotLevel = (x: unknown): x is BotLevel =>
  typeof x === "string" && (BOT_LEVELS as string[]).includes(x);

// What the Create table screen chooses.
export type TableSetup = {
  seats: number;        // 3 to 8, counting you
  botLevel: BotLevel;   // how well the computer players play
  target: Target;       // the score that wins: 150, 200 or 250
  clock: ClockSeconds;  // seconds to hit or stay: 15, 30 or 60
};

export const DEFAULT_TABLE: TableSetup = {
  seats: DEFAULT_SEATS,
  botLevel: DEFAULT_BOT_LEVEL,
  target: DEFAULT_TARGET,
  clock: DEFAULT_CLOCK,
};

// Whatever was stored, as a table the app can trust. Each choice is checked on its own,
// and anything unusable falls back to the default.
export function parseTable(raw: unknown): TableSetup {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_TABLE };
  const r = raw as Record<string, unknown>;
  return {
    seats: isSeatCount(r.seats) ? r.seats : DEFAULT_TABLE.seats,
    botLevel: isBotLevel(r.botLevel) ? r.botLevel : DEFAULT_TABLE.botLevel,
    target: isTarget(r.target) ? r.target : DEFAULT_TABLE.target,
    clock: isClockSeconds(r.clock) ? r.clock : DEFAULT_TABLE.clock,
  };
}

// The names of the computer players. A full table needs seven of them.
export const BOT_NAMES = ["Robo", "Bolt", "Cleo", "Dot", "Echo", "Fizz", "Gus", "Hex"] as const;

// The look of the computer player in bot number `index` (0 for the first). Colours are handed out
// in order starting just after yours, so nobody at the table shares your colour.
export function botLook(index: number, yourColor: string): Look {
  const start = Math.max(0, (COLORS as readonly string[]).indexOf(yourColor));
  return { character: ROBOT, color: COLORS[(start + 1 + index) % COLORS.length] };
}

// The players for a new offline game: you in seat 0, then computer players.
export function tableSetup(table: TableSetup, you: { name: string; look: Look }, random: () => number = Math.random): PlayerSetup[] {
  const bots = shuffle([...BOT_NAMES], random).slice(0, table.seats - 1);
  return [
    { name: you.name, look: you.look },
    ...bots.map((name, i): PlayerSetup => ({ name, bot: table.botLevel, look: botLook(i, you.look.color) })),
  ];
}
