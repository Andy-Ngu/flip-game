// The turn clock. It runs on every turn in every game: how long you get to hit or stay.
// Only the rules are here (what the options are, how urgent the time feels, how many missed
// turns hand your seat to a computer). The ticking itself lives in the screen.

export const CLOCK_CHOICES = [15, 30, 60] as const;
export type ClockSeconds = (typeof CLOCK_CHOICES)[number];
export const DEFAULT_CLOCK: ClockSeconds = 30;

export function isClockSeconds(x: unknown): x is ClockSeconds {
  return typeof x === "number" && (CLOCK_CHOICES as readonly number[]).includes(x);
}

// Letting the clock run out this many turns in a row hands your seat to a computer.
export const AUTO_STAY_LIMIT = 3;

// How the clock looks. Calm until 10 seconds are left, then orange, then red for the last 5.
export type ClockMood = "calm" | "low" | "critical";
export const LOW_SECONDS = 10;
export const CRITICAL_SECONDS = 5;

export function clockMood(secondsLeft: number): ClockMood {
  if (secondsLeft <= CRITICAL_SECONDS) return "critical";
  if (secondsLeft <= LOW_SECONDS) return "low";
  return "calm";
}

// Whole seconds left on the clock, rounded up so it shows "1" until the very last moment and
// "0" only once time is really up. `elapsedMs` is how long the clock has actually been running
// (the screen stops counting while the app is in the background).
export function secondsLeft(totalSeconds: number, elapsedMs: number): number {
  return Math.max(0, Math.ceil(totalSeconds - elapsedMs / 1000));
}

// The share of the clock still left, from 1 (full) down to 0, for the ring and the bar.
export function clockFraction(totalSeconds: number, elapsedMs: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - elapsedMs / (totalSeconds * 1000)));
}

// The clock ticks once a second for the last five seconds, and stops at 0 (time is up, not a tick).
export function shouldTick(secondsLeft: number): boolean {
  return secondsLeft > 0 && secondsLeft <= CRITICAL_SECONDS;
}
