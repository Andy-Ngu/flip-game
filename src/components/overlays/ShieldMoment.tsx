import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { Card } from "../../game/types";
import { useStyles, useUi } from "../AppContext";
import { CardFace, cardHeight } from "../cards/CardFace";
import { FILL } from "../fill";
import { Panel } from "../ui/Panel";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { makeStyles } from "./ShieldMoment.styles";

// The beats of the moment, in milliseconds from the start (at Normal speed). The two cards stay side by side
// for about three seconds, so there is time to read it; the whole thing is over a little before the table
// takes the panel away (SHIELD_MS). A tap closes it at once.
const APPEAR_MS = 120;      // the panel fades and grows in
const FLY_MS = 200;         // the duplicate flies in and hits the Shield
const HOLD_UNTIL_MS = 3300; // the two cards stay side by side so you can read what happened...
const LEAVE_MS = 400;       // ...then both leave together

const CARD_W = 64;
const SHIELD: Card = { kind: "action", action: "shield" };

type Props = {
  name: string;               // whose Shield it was
  isMe: boolean;
  duplicate: Card | null;     // the card that was blocked, or null if the table could not tell which one it was
  onDone?: () => void;        // the panel was tapped: the table takes it away
  inert?: boolean;            // let every touch through (while you pick a player, the panel must not stand in front of the players)
};

// Shown in the middle of the table when a Shield blocks a duplicate. Without it the Shield would just
// vanish and the duplicate would never appear, so it would look as if cards had disappeared for no
// reason. Here you see the duplicate fly in, hit the Shield, get crossed out, and both cards leave.
// Show it with a `key` that changes for every moment, so each one starts from the beginning.
// Only the panel takes a touch (it closes); the rest of the table stays playable around it.
export function ShieldMoment({ name, isMe, duplicate, onDone, inert = false }: Props) {
  const { colors, highContrast, reduceMotion, speed } = useUi();
  const styles = useStyles(makeStyles);
  const p = (ms: number) => paced(ms, speed);

  const appear = useSharedValue(0);                                  // the whole panel fading and growing in
  const incoming = useSharedValue(duplicate && !reduceMotion ? 1 : 0); // 1: the duplicate is far to the right; 0: it has landed
  const hit = useSharedValue(0);                                     // a quick pulse at the moment of impact
  const ring = useSharedValue(0);                                    // the gold ring growing out (0 to 1)
  const stamp = useSharedValue(0);                                   // the red cross landing on the duplicate (0 to 1)
  const leave = useSharedValue(0);                                   // both cards leaving (0 to 1)

  useEffect(() => {
    if (reduceMotion) {
      // Calm version: nothing flies or bounces. Both cards are simply there, the cross appears, and the panel fades out.
      appear.value = withTiming(1, { duration: p(150) });
      stamp.value = withDelay(p(150), withTiming(1, { duration: p(150) }));
      leave.value = withDelay(p(HOLD_UNTIL_MS), withTiming(1, { duration: p(LEAVE_MS) }));
      return;
    }
    const impact = APPEAR_MS + FLY_MS;
    appear.value = withTiming(1, { duration: p(APPEAR_MS) });
    incoming.value = withDelay(p(APPEAR_MS), withTiming(0, { duration: p(FLY_MS), easing: Easing.out(Easing.cubic) }));
    hit.value = withDelay(p(impact), withSequence(withTiming(1, { duration: p(70) }), withSpring(0, { damping: 6, stiffness: 160 })));
    ring.value = withDelay(p(impact), withTiming(1, { duration: p(520) }));
    stamp.value = withDelay(p(impact), withSpring(1, { damping: 9, stiffness: 220 }));
    leave.value = withDelay(p(HOLD_UNTIL_MS), withTiming(1, { duration: p(LEAVE_MS), easing: Easing.in(Easing.cubic) }));
  }, []);

  const panelMotion = useAnimatedStyle(() => ({
    opacity: appear.value * (1 - leave.value),
    transform: [{ scale: reduceMotion ? 1 : (0.7 + 0.3 * appear.value) * (1 - 0.2 * leave.value) }],
  }));
  const shieldMotion = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + hit.value * 0.18 }, { rotate: `${-leave.value * 10}deg` }],
  }));
  const duplicateMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: incoming.value * 140 + hit.value * 5 }, { rotate: `${incoming.value * 22 + leave.value * 12}deg` }],
  }));
  const ringMotion = useAnimatedStyle(() => ({
    opacity: ring.value === 0 ? 0 : (1 - ring.value) * 0.9,
    transform: [{ scale: 1 + ring.value * 0.8 }],
  }));
  const crossMotion = useAnimatedStyle(() => ({
    opacity: stamp.value,
    transform: [{ scale: reduceMotion ? 1 : 1.7 - 0.7 * stamp.value }],
  }));
  const veilMotion = useAnimatedStyle(() => ({ opacity: stamp.value * 0.35 }));

  const heading = duplicate ? "SHIELD BLOCKED IT" : "SHIELD USED";
  const line = duplicate
    ? isMe ? "Your Shield saved you" : `${name}'s Shield saved them`
    : isMe ? "Your Shield is gone" : `${name}'s Shield is gone`;
  const size = cardHeight(CARD_W);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${heading}. ${line}`}
        style={[panelMotion, styles.sized]}
      >
        <Panel tone="raised" outline={colors.gold} radius={16} style={styles.panel}>
          <View style={styles.row}>
            <Animated.View style={[{ width: CARD_W, height: size }, shieldMotion]}>
              <CardFace card={SHIELD} width={CARD_W} highContrast={highContrast} />
              {reduceMotion ? null : <Animated.View style={[styles.ring, ringMotion]} />}
            </Animated.View>

            {duplicate ? (
              <Animated.View style={[{ width: CARD_W, height: size }, duplicateMotion]}>
                <CardFace card={duplicate} width={CARD_W} highContrast={highContrast} />
                <Animated.View style={[styles.veil, veilMotion]} />
                <Animated.View style={[styles.cross, crossMotion]}>
                  <View style={[styles.crossBar, { transform: [{ rotate: "45deg" }] }]} />
                  <View style={[styles.crossBar, { transform: [{ rotate: "-45deg" }] }]} />
                </Animated.View>
              </Animated.View>
            ) : null}
          </View>

          <Animated.View entering={FadeIn.delay(p(reduceMotion ? 150 : APPEAR_MS + FLY_MS)).duration(p(150))} style={styles.words}>
            <T size={20} weight="display" spacing={2} lh={1.1} color={colors.gold} align="center">{heading}</T>
            <T size={14} weight={800} lh={1.25} color={colors.textDim} align="center">{line}</T>
          </Animated.View>
        </Panel>
        {onDone && !inert ? <Tap onPress={onDone} label="Close message" haptic={null} style={FILL} /> : null}
      </Animated.View>
    </View>
  );
}
