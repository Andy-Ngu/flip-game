import { memo, useEffect, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { FILL } from "../fill";

// The confetti colours are part of the celebration artwork (from the mockup), not the app palette.
// (The winner screen's confetti uses the same ones.)
export const CONFETTI_COLORS = ["#F2C14E", "#5BB4F0", "#E07A90", "#5FD39A", "#A97AE0", "#F4EFE6"];
const PIECES = 34;

type Piece = {
  x: number;       // where it starts, across the screen
  w: number;
  h: number;
  color: string;
  startY: number;  // a little above the top edge, so it drops in
  delay: number;   // ms before it lets go
  fall: number;    // ms it takes to reach the bottom
  sway: number;    // how far it drifts left and right while falling
  phase: number;   // where in its drift it starts
  tilt: number;    // the angle it starts at
  spin: number;    // how far it turns on the way down
};

// The pieces are worked out from their number with a fixed little formula, not Math.random(), so the
// confetti looks the same every time the screen draws it and nothing changes between renders.
function makePieces(width: number): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => {
    const r1 = ((i * 53) % 97) / 97;
    const r2 = ((i * 37) % 89) / 89;
    const r3 = ((i * 71) % 83) / 83;
    const w = 6 + Math.round(r3 * 6);
    const h = 10 + Math.round(r1 * 8);
    return {
      x: Math.round(8 + r1 * Math.max(0, width - 16 - w)),
      w,
      h,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startY: -(h + 10 + Math.round(r2 * 60)),
      delay: Math.round(r2 * 500),
      fall: Math.round(1600 + r3 * 1000),
      sway: 10 + Math.round(r1 * 22),
      phase: r2 * Math.PI * 2,
      tilt: Math.round(r2 * 160) - 80,
      spin: (r3 < 0.5 ? -1 : 1) * (240 + Math.round(r1 * 300)),
    };
  });
}

type PieceProps = { piece: Piece; travel: number };

// One piece of confetti. It falls once from above the screen to below it, drifting from side to side
// and turning, and then it is gone. The motion runs on the UI thread, so the game is not slowed down.
const ConfettiPiece = memo(function ConfettiPiece({ piece, travel }: PieceProps) {
  const { speed } = useUi();
  const fell = useSharedValue(0);   // 0 = still above the screen, 1 = past the bottom

  useEffect(() => {
    fell.value = withDelay(paced(piece.delay, speed), withTiming(1, { duration: paced(piece.fall, speed), easing: Easing.linear }));
  }, []);

  const { startY, sway, phase, tilt, spin } = piece;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.sin(fell.value * Math.PI * 4 + phase) * sway },
      { translateY: startY + fell.value * travel },
      { rotate: `${tilt + spin * fell.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: "absolute", left: piece.x, top: 0, width: piece.w, height: piece.h, borderRadius: 2, backgroundColor: piece.color }, style]}
    />
  );
});

// A shower of confetti over the whole screen. It never takes a touch.
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(width), [width]);
  return (
    <View pointerEvents="none" style={FILL} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} travel={height + 120} />
      ))}
    </View>
  );
}
