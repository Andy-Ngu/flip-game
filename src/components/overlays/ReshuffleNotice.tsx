import { useCallback, useEffect, useRef } from "react";
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
  ZoomIn,
} from "react-native-reanimated";
import { RESHUFFLE_MS } from "../../game/momentTimes";
import { paced } from "../../game/pace";
import { useStyles, useUi } from "../AppContext";
import { Dim } from "../ui/Dim";
import { FillBar } from "../ui/FillBar";
import { T } from "../ui/T";
import { makeStyles } from "./ReshuffleNotice.styles";

const SHOW_MS = RESHUFFLE_MS;   // the popup stays 2.5 seconds, long enough to read
const CARDS = 8;
const STAGGER_MS = 70;     // each card sets off a moment after the one before, like a riffle
const RIFFLE_MS = 1000;    // one card's riffle: it splits away, comes back and settles

type FanCardProps = { index: number };

// One card of the stack. Even cards swing out to the left and odd cards to the right, then they all
// slide back together: that is a riffle shuffle. `open` is how far apart the card is: 0 = in the stack,
// 1 = all the way out. It goes out quickly, nearly closes, then settles with a soft landing.
function FanCard({ index }: FanCardProps) {
  const { colors, reduceMotion, speed } = useUi();
  const side = index % 2 === 0 ? -1 : 1;
  const open = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;   // with Reduce motion the cards just stay stacked
    const run = paced(RIFFLE_MS, speed);
    open.value = withDelay(
      paced(index * STAGGER_MS, speed),
      withSequence(
        withTiming(1, { duration: run * 0.28, easing: Easing.out(Easing.cubic) }),
        withTiming(0.19, { duration: run * 0.34, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: run * 0.38, easing: Easing.out(Easing.quad) })
      )
    );
  }, []);

  const move = useAnimatedStyle(() => ({
    transform: [{ translateX: side * 64 * open.value }, { translateY: -8 * open.value }, { rotate: `${side * 14 * open.value}deg` }],
  }));

  const styles = useStyles(makeStyles);
  return (
    <Animated.View style={[styles.card, { top: 14 - index * 1.5, zIndex: index }, move]}>
      <T fixed size={22} weight="display" lh={1} color={colors.gold}>7</T>
    </Animated.View>
  );
}

type Props = { onDone: () => void };

// Shown over the dimmed table when the draw pile has run out and the discard pile is being shuffled back in.
// A stack of cards riffles together, with a small thud as it lands. It stays 2.5 seconds and
// tapping anywhere skips it. It never shows how many cards there are. The shuffle sound and the soft
// buzz are played by the table, not here.
export function ReshuffleNotice({ onDone }: Props) {
  const { reduceMotion, speed, colors } = useUi();
  const styles = useStyles(makeStyles);
  const latest = useRef(onDone);
  latest.current = onDone;
  const finished = useRef(false);
  const thud = useSharedValue(0);     // the stack landing on the table
  const filling = useSharedValue(0);  // the bar along the bottom: how much of the popup's time is used up

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    latest.current();
  }, []);

  useEffect(() => {
    const timer = setTimeout(finish, paced(SHOW_MS, speed));
    if (!reduceMotion) {
      filling.value = withTiming(1, { duration: paced(SHOW_MS, speed), easing: Easing.linear });
      // The stack drops a few pixels just as the halves meet.
      thud.value = withDelay(
        paced((CARDS - 1) * STAGGER_MS + RIFFLE_MS * 0.6, speed),
        withSequence(withTiming(1, { duration: paced(80, speed), easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 240 }))
      );
    }
    return () => clearTimeout(timer);
  }, []);

  const land = useAnimatedStyle(() => ({ transform: [{ translateY: thud.value * 5 }, { scaleY: 1 - thud.value * 0.05 }] }));

  return (
    <Dim strength={0.62} onPress={finish} label="Skip the shuffle">
      <View pointerEvents="none" style={styles.centre}>
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.springify().damping(14)}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel="Deck empty. Shuffling the discard pile."
          style={styles.panel}
        >
          <Animated.View style={[styles.fan, land]}>
            {Array.from({ length: CARDS }, (_, i) => (
              <FanCard key={i} index={i} />
            ))}
          </Animated.View>
          <View style={styles.words}>
            <T size={26} weight="display" spacing={1.5} lh={1} color={colors.gold}>DECK EMPTY</T>
            <T size={14} weight={700} lh={1.35} align="center">Shuffling the discard pile…</T>
          </View>
          {reduceMotion ? null : (
            <FillBar progress={filling} color={colors.gold} track={colors.bg} height={8} style={{ alignSelf: "stretch" }} />
          )}
        </Animated.View>
      </View>
    </Dim>
  );
}
