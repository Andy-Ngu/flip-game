import { useEffect } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { ordinal } from "../../game/results";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { hexAlpha } from "../overlays/glow";
import { T } from "../ui/T";

// Three small marks that sit on a player's tile (and on your own stage): the number of the order the
// round is played in, the PICK tag, and the glow that says "tap me". They only decorate: what they say
// is also in the words a screen reader speaks for the tile, so the marks themselves are hidden from it.

const HIDDEN = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" } as const;

export const BADGE_SIZE = 22;

type BadgeProps = {
  n: number;                    // 1 plays first
  speak?: boolean;              // true when nothing around it says it already (your stage); a tile says it in its own label
  style?: StyleProp<ViewStyle>; // where it sits
};

// The play order at the start of a round: a small round badge. The first player's is gold.
export function OrderBadge({ n, speak = false, style }: BadgeProps) {
  const { colors, reduceMotion } = useUi();
  const first = n === 1;
  const reading = speak ? ({ accessible: true, accessibilityLabel: `Plays ${ordinal(n)}` } as const) : HIDDEN;
  return (
    <Animated.View
      entering={reduceMotion ? undefined : ZoomIn.duration(160)}
      pointerEvents="none"
      {...reading}
      style={[
        {
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          borderWidth: 2,
          borderColor: colors.bg,
          backgroundColor: first ? colors.gold : colors.bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <T fixed size={12} weight="display" lh={1} color={first ? colors.onGold : colors.text}>{n}</T>
    </Animated.View>
  );
}

type TagProps = {
  large?: boolean;              // the bigger tag on your own row
  style?: StyleProp<ViewStyle>;
};

// The gold PICK tag of a player you can choose.
export function PickTag({ large = false, style }: TagProps) {
  const { colors } = useUi();
  return (
    <View
      pointerEvents="none"
      {...HIDDEN}
      style={[
        {
          paddingHorizontal: large ? 11 : 9,
          paddingVertical: large ? 5 : 3,
          borderRadius: 999,
          backgroundColor: colors.gold,
          boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 8, color: "rgba(0,0,0,0.4)" }],
        },
        style,
      ]}
    >
      <T fixed size={large ? 13 : 12} weight="display" spacing={1} lh={1} color={colors.onGold}>PICK</T>
    </View>
  );
}

// A gold glow around a player you can choose, swelling and fading about once every 1.6 seconds.
// Reduce motion keeps it still. Reduce flashes shows no glow at all: the tile gets a thicker gold outline instead.
export function PickGlow({ radius }: { radius: number }) {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const beat = useSharedValue(0);
  const still = reduceMotion || reduceFlashes;

  useEffect(() => {
    if (still) {
      cancelAnimation(beat);
      beat.value = 1;
      return;
    }
    beat.value = 0;
    beat.value = withRepeat(withTiming(1, { duration: paced(800, speed), easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(beat);
  }, [still, speed]);

  const swell = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * beat.value }));
  if (reduceFlashes) return null;

  return (
    <Animated.View pointerEvents="none" style={[FILL, swell]}>
      <View style={[FILL, { borderRadius: radius, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 18, color: hexAlpha(colors.gold, 0.7) }] }]} />
    </Animated.View>
  );
}
