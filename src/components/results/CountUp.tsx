import { useEffect, useState } from "react";
import { T, TProps } from "../ui/T";

type Props = Pick<TProps, "size" | "weight" | "color" | "lh"> & {
  from: number;
  to: number;
  delay?: number;      // wait this long (ms) before counting
  duration?: number;   // how long the counting takes (ms)
  animate: boolean;    // false: just show the final number (Reduce motion)
};

// A number that counts up from one value to another in a few quick steps, slowing down at the end
// like a counter coming to rest. It changes at most 14 times, so it is cheap to draw.
export function CountUp({ from, to, delay = 0, duration = 650, animate, ...text }: Props) {
  const [value, setValue] = useState(animate ? from : to);

  useEffect(() => {
    if (!animate || from === to) {
      setValue(to);
      return;
    }
    setValue(from);
    const steps = Math.min(14, Math.abs(to - from));
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let k = 1; k <= steps; k++) {
      const share = k / steps;
      // Even steps in value, but spaced so the first ones come quickly and the last ones slowly.
      const at = delay + duration * (1 - Math.sqrt(1 - share));
      const shown = k === steps ? to : from + Math.round((to - from) * share);
      timers.push(setTimeout(() => setValue(shown), at));
    }
    return () => timers.forEach(clearTimeout);
  }, [from, to, delay, duration, animate]);

  return <T {...text}>{String(value)}</T>;
}
