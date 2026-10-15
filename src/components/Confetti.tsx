import { useEffect, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { styles } from "./Confetti.styles";
import { theme } from "./theme";

const COLORS = [theme.gold, "#5BB4F0", "#FF7A85", "#5FD39A", theme.text];
const PIECES = 40;

// Paper falling slowly behind the winner. Each piece has its own random column, size,
// speed and spin, picked once when the screen opens.
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: Math.random(),
        width: 9 + Math.random() * 7,
        height: 15 + Math.random() * 11,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 1200,
        duration: 3000 + Math.random() * 2200,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        sway: 10 + Math.random() * 22,
      })),
    []
  );

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {pieces.map((p, i) => (
        <Piece key={i} {...p} />
      ))}
    </View>
  );
}

type PieceProps = {
  left: number; width: number; height: number; color: string;
  delay: number; duration: number; spin: number; sway: number;
};

function Piece({ left, width, height, color, delay, duration, spin, sway }: PieceProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const fall = useSharedValue(0); // 0: above the screen, 1: below it

  useEffect(() => {
    fall.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -30 + fall.value * (screenH + 60) },
      { translateX: Math.sin(fall.value * Math.PI * 4) * sway },
      { rotate: `${fall.value * spin}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.piece, { left: left * (screenW - width), width, height, backgroundColor: color, borderRadius: 2 }, style]}
    />
  );
}
