import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { cardHeightFor } from "../../game/tableMetrics";
import { Card } from "../../game/types";
import { useUi } from "../AppContext";
import { CardFace } from "../cards/CardFace";
import { FILL } from "../fill";

// The cards that drift slowly behind the logo on the title screen.
// Their places are written for the 390 by 844 screen the title was drawn on, and scaled to the real screen.
const DESIGN_W = 390;
const DESIGN_H = 844;
const CARD_W = 62;
const RISE = 10; // how far a card floats up, in px

const num = (value: number): Card => ({ kind: "number", value });
const bonus = (n: number): Card => ({ kind: "modifier", bonus: n, multiplier: 1 });

type Floater = {
  card: Card;
  x: number;        // left edge on the design screen (a card may hang off the edge)
  y: number;        // top edge on the design screen
  tilt: number;     // degrees
  opacity: number;  // faint ones sit further back
  seconds: number;  // how long one float up and down takes
};

const FLOATERS: Floater[] = [
  { card: num(9), x: 22, y: 60, tilt: -14, opacity: 0.5, seconds: 5.2 },
  { card: num(3), x: 290, y: 40, tilt: 12, opacity: 0.45, seconds: 6.1 },
  { card: num(12), x: 150, y: 20, tilt: 6, opacity: 0.3, seconds: 7.0 },
  { card: bonus(4), x: 330, y: 170, tilt: 16, opacity: 0.55, seconds: 5.6 },
  { card: num(5), x: -10, y: 190, tilt: -22, opacity: 0.4, seconds: 6.4 },
  { card: num(7), x: 60, y: 640, tilt: -12, opacity: 0.55, seconds: 5.9 },
  { card: num(1), x: 300, y: 650, tilt: 14, opacity: 0.5, seconds: 6.8 },
  { card: num(10), x: 180, y: 730, tilt: -5, opacity: 0.35, seconds: 7.3 },
  { card: num(4), x: -16, y: 520, tilt: 18, opacity: 0.4, seconds: 6.0 },
  { card: num(8), x: 336, y: 500, tilt: -16, opacity: 0.4, seconds: 5.4 },
];

// Decoration only: no touches, and screen readers skip it. With High contrast on (plain backgrounds)
// the cards are left out altogether.
export function TitleScreenFloaters() {
  const { width, height } = useWindowDimensions();
  const { highContrast } = useUi();
  if (highContrast) return null;
  return (
    <View pointerEvents="none" style={FILL} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {FLOATERS.map((floater, i) => (
        <DriftingCard
          key={i}
          floater={floater}
          index={i}
          left={(floater.x / DESIGN_W) * width}
          top={(floater.y / DESIGN_H) * height}
        />
      ))}
    </View>
  );
}

type DriftProps = { floater: Floater; index: number; left: number; top: number };

// One card. It floats up and down forever, each at its own pace and starting at its own moment,
// so they never move together. With Reduce motion on it just sits there.
function DriftingCard({ floater, index, left, top }: DriftProps) {
  const { reduceMotion } = useUi();
  const lift = useSharedValue(0); // 0: resting, 1: floated up
  const tilt = floater.tilt;

  useEffect(() => {
    if (reduceMotion) {
      lift.value = 0; // setting a plain number also stops any float that was running
      return;
    }
    const half = Math.round(floater.seconds * 500);
    const ease = Easing.inOut(Easing.sin);
    lift.value = withDelay(
      index * 240,
      withRepeat(withSequence(withTiming(1, { duration: half, easing: ease }), withTiming(0, { duration: half, easing: ease })), -1)
    );
  }, [reduceMotion]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: -RISE * lift.value }, { rotate: `${tilt}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left,
          top,
          width: CARD_W,
          height: cardHeightFor(CARD_W),
          borderRadius: 9,
          opacity: floater.opacity,
          boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 16, color: "rgba(0,0,0,0.4)" }],
        },
        motion,
      ]}
    >
      <CardFace card={floater.card} width={CARD_W} />
    </Animated.View>
  );
}
