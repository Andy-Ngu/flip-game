import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "../overlays/glow";

// A gold glow around the edges of the whole screen for the player who won. It fades in once and then
// just stays: nothing flashes or pulses. With Reduce flashes on it is a plain gold frame instead of a glow,
// and with Reduce motion on it is there from the start.
export function WinGlow() {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const fade = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) fade.value = withTiming(1, { duration: paced(700, speed) });
  }, [reduceMotion]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const look = reduceFlashes
    ? { borderWidth: 4, borderColor: colors.gold }
    : { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 70, spreadDistance: 14, color: hexAlpha(colors.gold, 0.4), inset: true }] };

  return <Animated.View pointerEvents="none" style={[FILL, look, fadeStyle]} />;
}
