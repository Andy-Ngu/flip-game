import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Card } from "../game/types";
import { CardFace } from "./CardFace";
import { styles } from "./ShieldBlock.styles";

// The beats of the moment, in milliseconds from the start.
const FLY_MS = 200;     // the duplicate flies in and hits the Shield
const HOLD_MS = 1300;   // ...they stay side by side so you can see what happened...
const LEAVE_MS = 380;   // ...then both leave together

type Props = {
  shield: Card;
  duplicate: Card | null;  // null if we couldn't tell which card was blocked
  onDone: () => void;
};

// Shown over a player when their Shield blocks a duplicate. Without it the Shield just
// vanishes and the duplicate never appears, so it looks like cards disappeared for no reason.
export function ShieldBlock({ shield, duplicate, onDone }: Props) {
  const appear = useSharedValue(0);                       // the whole panel fades and scales in
  const incoming = useSharedValue(duplicate ? 1 : 0);     // 1: the duplicate is far to the right; 0: it has landed
  const hit = useSharedValue(0);                          // a quick pulse at the moment of impact
  const ring = useSharedValue(0);                         // the gold ring growing out (0 to 1)
  const stamp = useSharedValue(0);                        // the red cross landing on the duplicate (0 to 1)
  const leave = useSharedValue(0);                        // both cards leaving (0 to 1)

  useEffect(() => {
    appear.value = withTiming(1, { duration: 120 });
    incoming.value = withDelay(120, withTiming(0, { duration: FLY_MS, easing: Easing.out(Easing.cubic) }));
    const impact = 120 + FLY_MS;
    hit.value = withDelay(impact, withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 6, stiffness: 160 })));
    ring.value = withDelay(impact, withTiming(1, { duration: 520 }));
    stamp.value = withDelay(impact, withSpring(1, { damping: 9, stiffness: 220 }));
    leave.value = withDelay(HOLD_MS, withTiming(1, { duration: LEAVE_MS, easing: Easing.in(Easing.cubic) }));

    const timer = setTimeout(onDone, HOLD_MS + LEAVE_MS + 40);
    return () => clearTimeout(timer);
  }, []);

  const panel = useAnimatedStyle(() => ({
    opacity: appear.value * (1 - leave.value),
    transform: [{ scale: (0.7 + 0.3 * appear.value) * (1 - 0.2 * leave.value) }],
  }));
  const shieldCard = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + hit.value * 0.18 }, { rotate: `${-leave.value * 10}deg` }],
  }));
  const duplicateCard = useAnimatedStyle(() => ({
    transform: [
      { translateX: incoming.value * 140 + hit.value * 5 },
      { rotate: `${incoming.value * 22 + leave.value * 12}deg` },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value === 0 ? 0 : (1 - ring.value) * 0.9,
    transform: [{ scale: 1 + ring.value * 0.8 }],
  }));
  const crossStyle = useAnimatedStyle(() => ({
    opacity: stamp.value,
    transform: [{ scale: 1.7 - 0.7 * stamp.value }],
  }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: stamp.value * 0.35 }));

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.panel, panel]}>
        <View style={styles.row}>
          <Animated.View style={[styles.cardBox, shieldCard]}>
            <CardFace card={shield} />
            <Animated.View style={[styles.ring, ringStyle]} />
          </Animated.View>

          {duplicate && (
            <Animated.View style={[styles.cardBox, duplicateCard]}>
              <CardFace card={duplicate} />
              <Animated.View style={[styles.dim, dimStyle]} />
              <Animated.View style={[styles.cross, crossStyle]}>
                <View style={[styles.crossBar, { transform: [{ rotate: "45deg" }] }]} />
                <View style={[styles.crossBar, { transform: [{ rotate: "-45deg" }] }]} />
              </Animated.View>
            </Animated.View>
          )}
        </View>

        <Animated.Text
          allowFontScaling={false}
          entering={FadeIn.delay(120 + FLY_MS).duration(150)}
          style={styles.label}
        >
          {duplicate ? "SHIELD BLOCKED IT" : "SHIELD USED"}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
