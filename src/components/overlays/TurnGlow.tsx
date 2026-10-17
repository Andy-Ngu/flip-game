import { useEffect, useRef } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "./glow";

type Props = {
  pulse: number;                  // a number that goes up by one every time the glow should play (your turn started)
  tone?: "gold" | "danger";       // gold for your turn; danger if the table ever wants a red one for the last seconds
};

// A soft glow along the edges of the screen that blooms and fades away, about 0.7 seconds, each time
// `pulse` changes. It is one part of the "your turn" alert, with the chime and the buzz that the table plays.
// The first value `pulse` has when the screen appears does not count, so nothing glows at the start.
// With Reduce flashes on there is no glow at all. It never takes a touch.
export function TurnGlow({ pulse, tone = "gold" }: Props) {
  const { colors, reduceFlashes, speed } = useUi();
  const level = useSharedValue(0);       // 0 = no glow, 1 = full glow
  const startedWith = useRef(pulse);

  useEffect(() => {
    if (pulse === startedWith.current || reduceFlashes) return;
    level.value = 0;
    level.value = withSequence(
      withTiming(1, { duration: paced(250, speed) }),   // blooms quickly...
      withTiming(0, { duration: paced(450, speed) })    // ...then fades away
    );
  }, [pulse]);

  const fade = useAnimatedStyle(() => ({ opacity: level.value }));
  if (reduceFlashes) return null;

  const color = tone === "danger" ? colors.danger : colors.gold;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[FILL, { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 46, spreadDistance: 8, color: hexAlpha(color, 0.85), inset: true }] }, fade]}
    />
  );
}
