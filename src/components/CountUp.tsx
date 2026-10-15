import { useEffect, useState } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

type Props = {
  from: number;
  to: number;
  delay?: number;     // ms to wait before counting
  duration?: number;  // ms the count takes
  style?: StyleProp<TextStyle>;
};

// A number that counts from one value to another, fast at first and slowing at the end.
export function CountUp({ from, to, delay = 0, duration = 700, style }: Props) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    setValue(from);
    if (from === to) return;
    let ticker: ReturnType<typeof setInterval> | undefined;
    const starter = setTimeout(() => {
      const began = Date.now();
      ticker = setInterval(() => {
        const t = Math.min(1, (Date.now() - began) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(from + (to - from) * eased));
        if (t >= 1 && ticker) clearInterval(ticker);
      }, 30);
    }, delay);
    return () => {
      clearTimeout(starter);
      if (ticker) clearInterval(ticker);
    };
  }, [from, to, delay, duration]);

  return (
    <Text allowFontScaling={false} style={style}>
      {value}
    </Text>
  );
}
