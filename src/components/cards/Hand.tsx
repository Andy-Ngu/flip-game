import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cardKey } from "../../game/cardFace";
import { describeCard } from "../../game/describe";
import { handSlots, Slot } from "../../game/handLayout";
import { paced } from "../../game/pace";
import { Card } from "../../game/types";
import { cardHeightFor } from "../../game/tableMetrics";
import { useStyles, useUi } from "../AppContext";
import { T } from "../ui/T";
import { CardBack } from "./CardBack";
import { CardFace } from "./CardFace";
import { HAND_PAD, makeStyles } from "./Hand.styles";

// Springs with a little overshoot: cards settle with a satisfying bounce.
const SETTLE = { damping: 11, stiffness: 150 };
const POP = { damping: 8, stiffness: 160 };
const FOLLOW = { damping: 16, stiffness: 220 }; // how tightly a card follows your finger

const IDLE_TILT = 5;   // degrees of the always-on 3D wobble on your turn
const TOUCH_TILT = 16; // degrees of tilt when your finger is on the card
const TWO_PI = Math.PI * 2;
const HOLD_MS = 450;   // press and hold a card this long to read about it

type TouchEvent = { nativeEvent: { locationX: number; locationY: number } };

// The card whose points are being counted right now (see game/countSteps.ts). A new `key` replays the lift.
export type Lit = { index: number; label: string; key: number };

type HandProps = {
  cards: Card[];
  cardW: number;
  dead: boolean;               // the player busted, so the cards droop and darken
  active: boolean;             // only the player whose turn it is gets the floating idle wobble
  duplicate?: number | null;   // the index of the card that caused a bust: it gets a red ring
  duplicateTag?: string;       // and this label, such as "7 again!"
  dealt?: boolean;             // false while the round is being set up: no cards are shown yet
  lit?: Lit | null;            // a card lifts and shows its points while the score is counted
  onHold?: (card: Card) => void; // press and hold a card to read about it
  arriveGap?: number;          // milliseconds between new cards: if the hand gets several at once (Draw Three) they come in one after another
};

export function Hand({ cards, cardW, dead, active, duplicate = null, duplicateTag, dealt = true, lit = null, onHold, arriveGap = 0 }: HandProps) {
  const styles = useStyles(makeStyles);
  const cardH = cardHeightFor(cardW);
  // The hand's width decides how tightly the cards fan out.
  const [width, setWidth] = useState(0);
  const slots = handSlots(cards.length, width, cardW);

  // With `arriveGap` set, the cards that were not in the hand at the last render wait their turn: the first one comes
  // straight away, the next a gap later, and so on. (Cards already in the hand have flown in long ago: this only
  // matters for the render in which a card first appears.)
  const seen = useRef<Set<number>>(new Set());
  const fresh = arriveGap > 0 ? cards.map(cardKey).filter((k) => !seen.current.has(k)) : [];
  useEffect(() => {
    seen.current = new Set(cards.map(cardKey));
  });

  return (
    <View
      style={[styles.hand, { height: cardH + 2 * HAND_PAD }]}
      onLayout={(e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width)}
    >
      {dealt && width > 0 &&
        cards.map((card, i) => (
          <HandCard
            key={cardKey(card)}
            card={card}
            index={i}
            slot={slots[i]}
            cardW={cardW}
            dead={dead}
            active={active}
            ringed={duplicate === i}
            tag={duplicate === i ? duplicateTag : undefined}
            lit={lit && lit.index === i ? lit : null}
            onHold={onHold}
            delay={Math.max(0, fresh.indexOf(cardKey(card))) * arriveGap}
          />
        ))}
    </View>
  );
}

type HandCardProps = {
  card: Card;
  index: number;
  slot: Slot;
  cardW: number;
  dead: boolean;
  active: boolean;
  ringed: boolean;
  tag?: string;
  lit: Lit | null;
  onHold?: (card: Card) => void;
  delay: number;                 // milliseconds to wait before flying in (0: straight away)
};

function HandCard({ card, index, slot, cardW, dead, active, ringed, tag, lit, onHold, delay }: HandCardProps) {
  const { highContrast, reduceMotion, colors, speed } = useUi();
  const styles = useStyles(makeStyles);
  const cardH = cardHeightFor(cardW);

  // Everything about how this card moves lives in shared values, which animate
  // on the UI thread so they stay smooth.
  //
  // Like in Balatro, the layout decides where a card BELONGS (slot) and these
  // values are the card's visual, which chases that spot with springs.
  const x = useSharedValue(reduceMotion ? slot.x : slot.x + 60);   // starts off to the right, like leaving a deck
  const y = useSharedValue(reduceMotion ? slot.lift : -70);        // ...and above
  const rot = useSharedValue(reduceMotion ? slot.rotate : slot.rotate + 25); // ...and tilted
  const scale = useSharedValue(reduceMotion ? 1 : 0.6);            // ...and small
  const flip = useSharedValue(reduceMotion ? 0 : 180);             // ...and face down
  const kick = useSharedValue(0);               // extra lean in the direction the card is moving
  const punch = useSharedValue(0);              // quick twist when you grab a card
  const phase = useSharedValue(Math.random() * TWO_PI); // where this card is in its idle circle
  const idle = useSharedValue(0);               // how strongly the idle wobble shows: 1 on your turn, 0 otherwise
  const touchX = useSharedValue(0);             // finger position on the card, -1 (left) to 1 (right)
  const touchY = useSharedValue(0);             // -1 (top) to 1 (bottom)
  const pressed = useSharedValue(0);            // 1 while a finger is on the card
  const droop = useSharedValue(0);              // 1 when the player has busted
  const counted = useSharedValue(0);            // 1 for a moment when this card's points are being counted
  const rise = useSharedValue(1);               // 0 to 1: the "+7" label floating up from the card (1 = gone)
  const shown = useSharedValue(delay > 0 && !reduceMotion ? 0 : 1);   // a card waiting for its turn to arrive cannot be seen yet
  const wait = useRef(reduceMotion ? 0 : delay);                       // used up by the first flight into the fan, below
  const [lifted, setLifted] = useState(false);
  const [pointsLabel, setPointsLabel] = useState<string | null>(null);
  const lastX = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once, when the card first appears: fly in, flip over and pop.
  useEffect(() => {
    if (reduceMotion) return;
    if (delay > 0) shown.value = withDelay(delay, withTiming(1, { duration: 1 }));
    flip.value = withDelay(delay + paced(140, speed), withTiming(0, { duration: paced(420, speed) }));
    scale.value = withDelay(delay + paced(60, speed), withSpring(1, POP));
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  // The idle wobble only plays for the player whose turn it is, so your eye goes to the right hand.
  // Phase goes round a full circle forever: sine on one tilt axis and cosine on the other
  // makes the card trace a slow circle, like a card floating in 3D.
  useEffect(() => {
    if (active && !reduceMotion) {
      idle.value = withDelay(400, withTiming(1, { duration: 400 }));
      const start = phase.value;
      phase.value = withDelay(400, withRepeat(withTiming(start + TWO_PI, { duration: 3600, easing: Easing.linear }), -1, false));
    } else {
      idle.value = withTiming(0, { duration: 300 }); // ease flat...
      cancelAnimation(phase);                        // ...and stop the loop, so idle hands cost nothing
    }
  }, [active, reduceMotion]);

  // Whenever the hand changes shape, glide to this card's place in the fan.
  useEffect(() => {
    if (reduceMotion) {
      x.value = slot.x;
      y.value = slot.lift;
      rot.value = slot.rotate;
      lastX.current = slot.x;
      return;
    }
    // A card that is being shoved sideways leans into the move, then rights itself.
    if (lastX.current !== null && lastX.current !== slot.x) {
      const dx = slot.x - lastX.current;
      kick.value = Math.max(-14, Math.min(14, dx * 0.3));
      kick.value = withSpring(0, POP);
    }
    lastX.current = slot.x;
    // A card that has to wait for its turn starts its flight into the fan only then.
    const later = wait.current;
    wait.current = 0;
    const go = (to: number, spring = SETTLE) => (later > 0 ? withDelay(later, withSpring(to, spring)) : withSpring(to, spring));
    x.value = go(slot.x);
    y.value = go(slot.lift);
    rot.value = go(slot.rotate);
  }, [slot.x, slot.lift, slot.rotate, reduceMotion]);

  useEffect(() => {
    droop.value = reduceMotion ? (dead ? 1 : 0) : withSpring(dead ? 1 : 0, SETTLE);
  }, [dead, reduceMotion]);

  // While the score is counted, this card hops up and its points float away above it.
  // (With Reduce motion on, the number in the score box is all that moves.)
  useEffect(() => {
    if (!lit || reduceMotion) return;
    // The card hops up, hangs there a moment (so the eye can find it) and settles back.
    counted.value = withSequence(
      withTiming(1, { duration: paced(130, speed) }),
      withTiming(1, { duration: paced(180, speed) }),
      withTiming(0, { duration: paced(280, speed) })
    );
    rise.value = 0;
    rise.value = withTiming(1, { duration: paced(1000, speed), easing: Easing.out(Easing.quad) });
    // The label stays on screen until it has floated away, even after the next card has lit up.
    setPointsLabel(lit.label);
    if (labelTimer.current) clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => setPointsLabel(null), paced(1050, speed));
  }, [lit?.key, reduceMotion]);
  useEffect(
    () => () => {
      if (labelTimer.current) clearTimeout(labelTimer.current);
    },
    []
  );

  // Derived tilt, in degrees. Idle: a small circle. Touched: follows the finger.
  const tiltX = useDerivedValue(
    () => Math.sin(phase.value) * IDLE_TILT * idle.value * (1 - pressed.value) - touchY.value * TOUCH_TILT * pressed.value
  );
  const tiltY = useDerivedValue(
    () => Math.cos(phase.value) * IDLE_TILT * idle.value * (1 - pressed.value) + touchX.value * TOUCH_TILT * pressed.value
  );

  const lean = index % 2 === 0 ? -6 : 6;
  const motion = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value + Math.sin(phase.value) * 1.5 * idle.value - pressed.value * 14 + droop.value * 6 - counted.value * 18 },
      { rotate: `${rot.value + kick.value + punch.value + droop.value * lean}deg` },
      { scale: scale.value * (1 + pressed.value * 0.18) * (1 + counted.value * 0.12) },
    ],
  }));
  // The points of the card being counted: they appear just above it, float up and fade out.
  const points = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value / 0.12) * (1 - Math.max(0, (rise.value - 0.55) / 0.45)),
    transform: [{ translateY: -rise.value * 12 }],
  }));
  // The tilt lives on its own inner layer so it never disturbs the card's position.
  const tilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  // The shadow sits under the card and drifts further away as the card lifts.
  const shadow = useAnimatedStyle(() => ({
    opacity: 0.16 + pressed.value * 0.18,
    transform: [{ translateX: -tiltY.value * 0.4 }, { translateY: 3 + pressed.value * 12 }],
  }));
  // A soft band of light that slides across as the card tilts, a small nod to Balatro's foil shine.
  const sheen = useAnimatedStyle(() => ({
    opacity: 0.1 * idle.value + pressed.value * 0.25,
    transform: [{ translateX: cardW / 2 - 10 + (tiltY.value / TOUCH_TILT) * cardW * 0.7 }, { rotate: "20deg" }],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${flip.value}deg` }],
    opacity: flip.value < 90 ? 1 : 0,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${flip.value - 180}deg` }],
    opacity: flip.value >= 90 ? 1 : 0,
  }));
  const deadShade = useAnimatedStyle(() => ({ opacity: droop.value * 0.4 }));

  // Turn a finger position into -1..1 on each axis.
  function aim(e: TouchEvent) {
    const nx = (e.nativeEvent.locationX - cardW / 2) / (cardW / 2);
    const ny = (e.nativeEvent.locationY - cardH / 2) / (cardH / 2);
    touchX.value = withSpring(Math.max(-1, Math.min(1, nx)), FOLLOW);
    touchY.value = withSpring(Math.max(-1, Math.min(1, ny)), FOLLOW);
  }
  function release() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setLifted(false);
    pressed.value = withSpring(0, SETTLE);
    touchX.value = withSpring(0, SETTLE);
    touchY.value = withSpring(0, SETTLE);
  }

  return (
    // Touch and hold a card to lift it and look closer. A lifted card also jumps to the front of the fan.
    <Animated.View style={[styles.slot, { width: cardW, height: cardH, zIndex: lifted || pointsLabel ? 50 : index }, motion]}>
      <Animated.View pointerEvents="none" style={[styles.shadow, { width: cardW, height: cardH, borderRadius: 10 * (cardW / 68) }, shadow]} />
      <Animated.View
        style={[styles.tilt, { width: cardW, height: cardH }, tilt]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View style={[styles.layer, front]}>
          <CardFace card={card} width={cardW} highContrast={highContrast} />
          <Animated.View pointerEvents="none" style={[styles.shadow, { width: cardW, height: cardH, borderRadius: 10 * (cardW / 68), backgroundColor: "#1A1A1A" }, deadShade]} />
          <View pointerEvents="none" style={[styles.sheenClip, { borderRadius: 10 * (cardW / 68) }]}>
            <Animated.View style={[styles.sheen, { height: cardH + 60 }, sheen]} />
          </View>
          {ringed ? <View pointerEvents="none" style={[styles.ringed, { borderRadius: 10 * (cardW / 68), borderWidth: 3 }]} /> : null}
        </Animated.View>
        <Animated.View style={[styles.layer, back]}>
          <CardBack width={cardW} />
        </Animated.View>
      </Animated.View>
      {pointsLabel && !reduceMotion ? (
        // The points sit on a dark chip with a gold edge: gold letters straight on the card art were hard to read.
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: -14, alignItems: "center" }, points]}>
          <View
            style={{
              paddingHorizontal: 9, paddingVertical: 2, borderRadius: 12,
              borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.bgDeep,
            }}
          >
            <T fixed size={22} weight="display" lh={1.1} color={colors.text}>{pointsLabel}</T>
          </View>
        </Animated.View>
      ) : null}
      {tag ? (
        <View pointerEvents="none" style={styles.tag}>
          <View style={styles.tagBox}>
            <T fixed size={11} weight={900} color={colors.bg} numberOfLines={1}>{tag}</T>
          </View>
        </View>
      ) : null}
      {/* A clear layer on top catches the touches, so finger positions are measured against the card itself. */}
      <View
        style={styles.touch}
        accessible
        accessibilityLabel={describeCard(card)}
        accessibilityHint={onHold ? "Press and hold to read about this card" : undefined}
        accessibilityActions={onHold ? [{ name: "longpress", label: "Read about this card" }] : undefined}
        onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
          if (e.nativeEvent.actionName === "longpress" && onHold) onHold(card);
        }}
        onTouchStart={(e: TouchEvent) => {
          // With Reduce motion on, the card does not lift, twist or lean toward your finger.
          if (!reduceMotion) {
            setLifted(true);
            pressed.value = withSpring(1, POP);
            punch.value = withSequence(withTiming(-6, { duration: 50 }), withSpring(0, POP));
            aim(e);
          }
          if (onHold) holdTimer.current = setTimeout(() => onHold(card), HOLD_MS);
        }}
        onTouchMove={(e: TouchEvent) => {
          if (!reduceMotion) aim(e);
        }}
        onTouchEnd={release}
        onTouchCancel={release}
      />
    </Animated.View>
  );
}
