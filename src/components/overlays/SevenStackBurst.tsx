import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useStyles, useUi } from "../AppContext";
import { FILL } from "../fill";
import { Dim } from "../ui/Dim";
import { FillBar } from "../ui/FillBar";
import { T } from "../ui/T";
import { Confetti } from "./Confetti";
import { StampedTitle } from "./StampedTitle";
import { makeStyles } from "./SevenStackBurst.styles";

// How long the table waits after a Seven Stack before it opens the results (the "ending" step in useTable).
// The countdown and the bar below are timed to match it.
const BURST_MS = 3000;

type Props = {
  name: string;     // who made the Seven Stack
  isMe: boolean;
};

// The big celebration when someone gets seven different numbers: a gold glow along the screen edges that
// fades in ONCE (it never pulses or flashes), a shower of confetti, "SEVEN STACK!" and the +15 bonus.
// The round ends at once, so a note says so and counts down to the results.
// With Reduce motion or Reduce flashes on, it is a calm still picture instead: a plain gold frame and the
// words, with no confetti. The table removes it when the results open. It never takes a touch.
// The rising chime and the double buzz are played by the table, not here.
export function SevenStackBurst({ name, isMe }: Props) {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const styles = useStyles(makeStyles);
  const calm = reduceMotion || reduceFlashes;
  const total = paced(BURST_MS, speed);

  const glow = useSharedValue(calm ? 1 : 0);          // the edge glow: fades in once, then stays
  const pop = useSharedValue(reduceMotion ? 1 : 0);   // the words popping in
  const bonus = useSharedValue(reduceMotion ? 1 : 0); // the +15 popping in a moment later
  const bar = useSharedValue(0);                      // how much of the wait is used up (0 to 1)
  const [left, setLeft] = useState(Math.ceil(total / 1000));
  const startLeft = useRef(left);

  useEffect(() => {
    if (!calm) glow.value = withTiming(1, { duration: paced(700, speed) });
    if (!reduceMotion) {
      pop.value = withSpring(1, { damping: 9, stiffness: 160 });
      bonus.value = withDelay(paced(450, speed), withSpring(1, { damping: 9, stiffness: 160 }));
      bar.value = withTiming(1, { duration: total, easing: Easing.linear });
    }
    // The seconds-left words only change about once a second, so this is cheap.
    const started = Date.now();
    const timer = setInterval(() => setLeft(Math.ceil(Math.max(0, total - (Date.now() - started)) / 1000)), 200);
    return () => clearInterval(timer);
  }, []);

  const glowFade = useAnimatedStyle(() => ({ opacity: glow.value }));
  const bannerMotion = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 3), transform: [{ scale: 0.8 + 0.2 * pop.value }] }));
  const bonusMotion = useAnimatedStyle(() => ({ opacity: Math.min(1, bonus.value * 3), transform: [{ scale: 0.8 + 0.2 * bonus.value }] }));

  const who = isMe ? "You have" : `${name} has`;
  const countdown = left > 0 ? `Results open in ${left} second${left === 1 ? "" : "s"}` : "Results are opening…";
  const stepFraction = startLeft.current > 0 ? 1 - left / startLeft.current : 1;

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={`Seven Stack! ${who} 7 different numbers. Seven Stack bonus, plus 15. The round ends now.`}
      style={FILL}
    >
      <Dim strength={0.5} />
      {calm ? <View style={styles.frame} /> : <Animated.View style={[styles.glow, glowFade]} />}
      {calm ? null : <Confetti />}

      <View style={styles.root} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View style={[styles.banner, bannerMotion]}>
          <StampedTitle size={54} depth={4} spacing={2}>SEVEN STACK!</StampedTitle>
          <T size={15} weight={800} align="center">{`${who} 7 different numbers`}</T>
        </Animated.View>

        <Animated.View style={[styles.bonus, bonusMotion]}>
          <T size={14} weight={800} color={colors.gold}>Seven Stack bonus</T>
          <T size={28} weight="display" lh={1} color={colors.gold}>+15</T>
        </Animated.View>

        <View style={styles.note}>
          <T size={12.5} weight={800} lh={1.35} align="center" color={colors.textDim}>The round ends now. Everyone still playing banks their points.</T>
          {reduceMotion ? (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${stepFraction * 100}%` }]} />
            </View>
          ) : (
            <FillBar progress={bar} color={colors.gold} track={colors.bg} height={8} style={{ alignSelf: "stretch" }} />
          )}
          <T size={11.5} weight={800} color={colors.textFaint}>{countdown}</T>
        </View>
      </View>
    </View>
  );
}
