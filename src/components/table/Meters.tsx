import { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { BustOdds, oddsLevel } from "../../game/odds";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { Icon } from "../ui/Icon";
import { T } from "../ui/T";

// The two bars at the bottom of your stage. Both have a label on the left and a number on the right,
// so they can be read without telling the colours apart.

// The seventh slot when one more different number makes a Seven Stack: a gold outline, and a gold fill
// that swells and fades. Reduce motion and Reduce flashes keep only the calm outline.
function HotSlot() {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const calm = reduceMotion || reduceFlashes;
  const beat = useSharedValue(0);

  useEffect(() => {
    if (calm) {
      cancelAnimation(beat);
      beat.value = 0;
      return;
    }
    beat.value = withRepeat(withTiming(1, { duration: paced(650, speed), easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(beat);
  }, [calm, speed]);

  const swell = useAnimatedStyle(() => ({ opacity: 0.15 + 0.85 * beat.value }));
  return (
    <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.gold, overflow: "hidden" }}>
      {calm ? null : <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: colors.gold }, swell]} />}
    </View>
  );
}

// The room the number on the right of a bar needs ("3/7", "100%"): "100%" in the big numbers is 37 px wide at
// Normal text and 45 and 52 at Large and Largest, so the box grows with the Text size setting.
const readoutWidth = (scale: number): number => Math.ceil(38 * scale) + 1;

export function SevenStackMeter({ count, labelW, pulse = false }: { count: number; labelW: number; pulse?: boolean }) {
  const { colors, scale } = useUi();
  const shown = Math.min(7, count);
  const hot = pulse && shown < 7 ? 6 : -1;   // one more different number completes the stack: the last slot calls for it
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      accessible
      accessibilityLabel={`Seven Stack: ${shown} of 7 different numbers${hot >= 0 ? ". One more different number makes a Seven Stack." : ""}`}
    >
      <View style={{ width: labelW }}>
        <T size={11} weight={800} spacing={1} color={colors.textFaint} numberOfLines={1}>SEVEN STACK</T>
      </View>
      <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
        {Array.from({ length: 7 }, (_, i) =>
          i === hot ? (
            <HotSlot key={i} />
          ) : (
            <View
              key={i}
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                backgroundColor: i < shown ? colors.gold : colors.bg,
                borderWidth: i < shown ? 0 : colors.borderWidth > 2 ? 1.5 : 0,
                borderColor: colors.border,
              }}
            />
          )
        )}
      </View>
      <View style={{ width: readoutWidth(scale), alignItems: "flex-end" }}>
        <T size={15} weight="display" lh={1.05}>{`${shown}/7`}</T>
      </View>
    </View>
  );
}

export function BustOddsMeter({ odds, labelW }: { odds: BustOdds; labelW: number }) {
  const { colors, scale } = useUi();
  const level = oddsLevel(odds.percent);
  const tint = level === "low" ? colors.good : level === "medium" ? colors.gold : colors.danger;
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      accessible
      accessibilityLabel={`Bust odds: ${odds.percent} percent${odds.shield ? ". You hold a Shield, so a duplicate would be blocked." : ""}`}
    >
      <View style={{ width: labelW, flexDirection: "row", alignItems: "center", gap: 5 }}>
        <T size={11} weight={800} spacing={1} color={colors.textFaint} numberOfLines={1}>BUST ODDS</T>
        {odds.shield ? <Icon name="shield" size={13} color={colors.good} stroke={3} /> : null}
      </View>
      <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.bg, overflow: "hidden", borderWidth: colors.borderWidth > 2 ? 1.5 : 0, borderColor: colors.border }}>
        <View style={{ width: `${Math.max(odds.percent, odds.percent > 0 ? 3 : 0)}%`, height: "100%", borderRadius: 5, backgroundColor: tint }} />
      </View>
      <View style={{ width: readoutWidth(scale), alignItems: "flex-end" }}>
        <T size={15} weight="display" lh={1.05} color={tint}>{`${odds.percent}%`}</T>
      </View>
    </View>
  );
}
