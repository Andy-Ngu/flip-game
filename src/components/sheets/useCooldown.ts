import { useEffect, useState } from "react";
import { cooldownLeft } from "../../game/chat";

const STEP_MS = 250;

// How many milliseconds are left before the player may send another message (0 = they may send now).
// `lastSentAt` is when they last sent one, or null. While a pause is running this checks the clock four
// times a second so the screen can count down; once it is over, or when there is no pause, it stops, so a
// sheet that is just sitting open costs nothing.
export function useCooldown(lastSentAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const start = Date.now();
    setNow(start);
    if (cooldownLeft(lastSentAt, start) <= 0) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (cooldownLeft(lastSentAt, t) <= 0) clearInterval(timer);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [lastSentAt]);

  return cooldownLeft(lastSentAt, now);
}
