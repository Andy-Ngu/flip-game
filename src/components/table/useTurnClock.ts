import { useEffect, useRef, useState } from "react";
import { ClockMood, clockMood, secondsLeft as secondsLeftAt } from "../../game/clock";

// The turn clock as the table shows it.
// `ring` is where the ring should be heading and `ringMs` how long it takes to get there, so it
// shrinks smoothly between two ticks of the clock instead of jumping.
export type ClockView = { secondsLeft: number; ring: number; ringMs: number; mood: ClockMood };

type Options = {
  total: number;              // seconds the player gets for a turn
  active: boolean;            // it is the player's turn
  paused: boolean;            // the clock is held (a menu is open, or the app is in the background)
  resetKey: unknown;          // a new value starts the clock again from full
  onExpire: () => void;       // the clock reached 0
  onTick: (secondsLeft: number) => void; // a second went by (called with the new number of seconds left)
};

const STEP_MS = 100;

// The turn clock. It counts real time only while `active` and not `paused`, so a menu or another
// app does not use up your time. It reports a new value once a second and tells the ring to move
// steadily towards where it will be at the next tick (so the ring does not jump, and the screen is
// not redrawn ten times a second). Returns null when it is not the player's turn.
export function useTurnClock({ total, active, paused, resetKey, onExpire, onTick }: Options): ClockView | null {
  const [view, setView] = useState<ClockView | null>(null);
  const latest = useRef({ onExpire, onTick });
  latest.current = { onExpire, onTick };

  const elapsedBefore = useRef(0);      // ms counted before the clock was last paused
  const segmentStart = useRef(0);       // when the clock last started or resumed
  const expired = useRef(false);
  const lastLeft = useRef(total);

  // A new turn: start again from full.
  useEffect(() => {
    elapsedBefore.current = 0;
    segmentStart.current = Date.now();
    expired.current = false;
    lastLeft.current = total;
    setView(active ? { secondsLeft: total, ring: Math.max(0, total - 1) / total, ringMs: 1000, mood: clockMood(total) } : null);
  }, [resetKey, active, total]);

  // Count while running.
  useEffect(() => {
    if (!active) return;
    if (paused) {
      // Hold the ring where it is.
      const e = elapsedBefore.current;
      setView((v) => (v ? { ...v, ring: Math.max(0, 1 - e / (total * 1000)), ringMs: 0 } : v));
      return;
    }
    segmentStart.current = Date.now();
    const base = elapsedBefore.current;
    // Resuming: carry on towards the next whole second.
    const leftNow = secondsLeftAt(total, base);
    setView({ secondsLeft: leftNow, ring: Math.max(0, leftNow - 1) / total, ringMs: Math.max(0, 1000 - (base % 1000)), mood: clockMood(leftNow) });
    lastLeft.current = leftNow;

    const timer = setInterval(() => {
      const elapsed = base + (Date.now() - segmentStart.current);
      const left = secondsLeftAt(total, elapsed);
      if (left !== lastLeft.current) {
        lastLeft.current = left;
        setView({ secondsLeft: left, ring: Math.max(0, left - 1) / total, ringMs: 1000, mood: clockMood(left) });
        latest.current.onTick(left);
      }
      if (elapsed >= total * 1000 && !expired.current) {
        expired.current = true;
        latest.current.onExpire();
      }
    }, STEP_MS);

    return () => {
      clearInterval(timer);
      elapsedBefore.current = base + (Date.now() - segmentStart.current);
    };
  }, [active, paused, total, resetKey]);

  return active ? view : null;
}
