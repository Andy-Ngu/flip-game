import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { hexAlpha } from "../overlays/glow";
import { T } from "../ui/T";
import type { CountView } from "./useTable";

type Props = {
  points: number;           // what your hand scores right now
  bust: boolean;            // you busted: the number is red
  count: CountView | null;  // the score being counted after you stay (see game/countSteps.ts)
};

// How far the number swells with each step of the count (0.2 means a fifth bigger), and on the last
// step, by how good the score is.
const STEP_POP = 0.14;
const FINISH_POP = { normal: 0.2, big: 0.35, huge: 0.5 };

// The "THIS ROUND +N" box on your stage, next to TOTAL SCORE (the two share the width between them, so the
// header has no empty space in it). After you stay it counts your score up one card at a time: the number
// swells a little with each card and the last one gets a bigger finish (and, for a big score, a soft gold glow
// that fades in once). The number always sits on the solid dark box, never on the glow, so it stays readable.
// Reduce motion keeps only the number changing, and Reduce flashes leaves the glow out.
export function RoundScore({ points, bust, count }: Props) {
  const { colors, scale, reduceMotion, reduceFlashes, speed } = useUi();
  const shown = count ? count.shown : points;
  const pop = useSharedValue(0);    // how far the number is swollen right now
  const glow = useSharedValue(0);   // 0 to 1: the gold glow around the box

  // Each step swells the number, then lets it spring back.
  useEffect(() => {
    if (!count || reduceMotion) return;
    const size = count.finish ? FINISH_POP[count.finish] : STEP_POP;
    pop.value = withSequence(withTiming(size, { duration: paced(110, speed) }), withSpring(0, { damping: 7, stiffness: 150 }));
  }, [count?.key, count?.shown, reduceMotion]);

  // A big score glows once. The glow fades in with the last card and out again when the count is over.
  const glowing = !reduceFlashes && (count?.finish === "big" || count?.finish === "huge");
  useEffect(() => {
    glow.value = withTiming(glowing ? 1 : 0, { duration: paced(glowing ? 250 : 500, speed) });
  }, [glowing, speed]);

  const numberStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View
      style={{
        flexGrow: 1, flexShrink: 1, alignItems: "center", justifyContent: "center", gap: 2,
        paddingHorizontal: 9, paddingTop: 5, paddingBottom: 4,
        borderRadius: 12, borderWidth: 2, borderColor: count ? colors.gold : colors.border, backgroundColor: colors.bg,
      }}
      accessible
      accessibilityLabel={`This round ${pointsText(points)}`}
    >
      {/* The glow is the shadow of this empty box: it is drawn outside the box only, never behind the number. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: -2, right: -2, top: -2, bottom: -2, borderRadius: 12, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 18, color: hexAlpha(colors.gold, 0.5) }] },
          glowStyle,
        ]}
      />
      {/* With bigger text the short word fits where the long one would not. (A screen reader says the whole name.) */}
      <T size={10.5} weight={900} spacing={0.6} lh={1} align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} color={count ? colors.gold : colors.textFaint}>
        {scale > 1 ? "ROUND" : "THIS ROUND"}
      </T>
      <Animated.View style={numberStyle}>
        <T size={scale > 1 ? 28 : 32} weight="display" lh={1} color={bust ? colors.danger : count ? colors.gold : colors.text}>{`+${shown}`}</T>
      </Animated.View>
    </View>
  );
}
