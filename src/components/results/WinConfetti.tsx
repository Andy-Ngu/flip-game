import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { CONFETTI_COLORS } from "../overlays/Confetti";

type Piece = { x: number; y: number; w: number; h: number; color: string; rot: number; spin: number; fall: number; delay: number; duration: number };

// 30 pieces spread over the top of the screen. The numbers come from a fixed formula, not from
// Math.random, so the pieces land in the same places every time the screen is drawn.
function makePieces(width: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < 30; i++) {
    const a = ((i * 53) % 97) / 97;
    const b = ((i * 37) % 89) / 89;
    const c = ((i * 71) % 83) / 83;
    pieces.push({
      x: Math.round(8 + a * Math.max(0, width - 30)),
      y: Math.round(8 + b * 300),
      w: 6 + Math.round(c * 6),
      h: 10 + Math.round(a * 8),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot: Math.round(b * 160) - 80,
      spin: 120 + Math.round(c * 240),
      fall: 90 + Math.round(a * 140),
      delay: Math.round(c * 700),
      duration: 1800 + Math.round(b * 1200),
    });
  }
  return pieces;
}

// One bit of paper: it fades in, drifts down while it turns, and fades out. It happens once.
function ConfettiPiece({ piece, delay, duration }: { piece: Piece; delay: number; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.12 ? t.value / 0.12 : t.value > 0.7 ? Math.max(0, (1 - t.value) / 0.3) : 1,
    transform: [{ translateY: -20 + t.value * piece.fall }, { rotate: `${piece.rot + t.value * piece.spin}deg` }],
  }));
  return (
    <Animated.View
      style={[{ position: "absolute", left: piece.x, top: piece.y, width: piece.w, height: piece.h, borderRadius: 2, backgroundColor: piece.color }, style]}
    />
  );
}

// A single shower of confetti for the winner. Once it is over it removes itself from the screen.
export function WinConfetti({ width }: { width: number }) {
  const { speed } = useUi();
  const pieces = useMemo(() => makePieces(width), [width]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), paced(4200, speed));
    return () => clearTimeout(t);
  }, [speed]);

  if (done) return null;
  return (
    <View pointerEvents="none" style={FILL} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} delay={paced(p.delay, speed)} duration={paced(p.duration, speed)} />
      ))}
    </View>
  );
}
