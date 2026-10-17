// How fast the game moves. The "Game speed" setting scales every pause the game chooses
// (the computers' thinking time, how long a result stays on screen, how long an animation runs).

export type GameSpeed = "slower" | "normal" | "faster";
export const GAME_SPEEDS: GameSpeed[] = ["slower", "normal", "faster"];
export const DEFAULT_SPEED: GameSpeed = "normal";

export function isGameSpeed(x: unknown): x is GameSpeed {
  return typeof x === "string" && (GAME_SPEEDS as string[]).includes(x);
}

// Multiplies a time in milliseconds: slower takes longer, faster takes less.
const FACTOR: Record<GameSpeed, number> = { slower: 1.5, normal: 1, faster: 0.6 };

export function paced(ms: number, speed: GameSpeed): number {
  return Math.round(ms * FACTOR[speed]);
}

// A computer takes a short, slightly different pause every time, so it feels like a person playing.
export const BOT_PAUSE_MIN_MS = 600;
export const BOT_PAUSE_MAX_MS = 900;

export function botPauseMs(speed: GameSpeed, random: () => number = Math.random): number {
  return paced(BOT_PAUSE_MIN_MS + random() * (BOT_PAUSE_MAX_MS - BOT_PAUSE_MIN_MS), speed);
}
