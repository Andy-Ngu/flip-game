import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
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
import { cardKey } from "../game/cardFace";
import { describeCard } from "../game/describe";
import { CARD_H, CARD_W, handSlots, Slot } from "../game/handLayout";
import { Card } from "../game/types";
import { CardBack, CardFace } from "./CardFace";
import { styles } from "./Hand.styles";

// Springs with a little overshoot: cards settle with a satisfying bounce.
const SETTLE = { damping: 11, stiffness: 150 };
const POP = { damping: 8, stiffness: 160 };
const FOLLOW = { damping: 16, stiffness: 220 }; // how tightly a card follows your finger

const IDLE_TILT = 5; // degrees of the always-on 3D wobble
const TOUCH_TILT = 16; // degrees of tilt when your finger is on the card
const TWO_PI = Math.PI * 2;

type TouchEvent = { nativeEvent: { locationX: number; locationY: number } };

type HandProps = {
  cards: Card[];
  dead: boolean; // the player busted, so the cards droop and darken
  active: boolean; // only the player whose turn it is gets the floating idle wobble
};

export function Hand({ cards, dead, active }: HandProps) {
  // The hand's width decides how tightly the cards fan out.
  const [width, setWidth] = useState(0);
  const slots = handSlots(cards.length, width);

  return (
    <View style={styles.hand} onLayout={(e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width)}>
      {cards.length === 0 && <Text style={styles.empty}>No cards yet</Text>}
      {width > 0 &&
        cards.map((card, i) => (
          <HandCard key={cardKey(card)} card={card} index={i} slot={slots[i]} dead={dead} active={active} />
        ))}
    </View>
  );
}

type HandCardProps = { card: Card; index: number; slot: Slot; dead: boolean; active: boolean };

function HandCard({ card, index, slot, dead, active }: HandCardProps) {
  // Everything about how this card moves lives in shared values, which animate
  // on the UI thread so they stay smooth.
  //
  // Like in Balatro, the layout decides where a card BELONGS (slot) and these
  // values are the card's visual, which chases that spot with springs.
  const x = useSharedValue(slot.x + 60);        // starts off to the right, like leaving a deck
  const y = useSharedValue(-70);                // ...and above
  const rot = useSharedValue(slot.rotate + 25); // ...and tilted
  const scale = useSharedValue(0.6);            // ...and small
  const flip = useSharedValue(180);             // ...and face down
  const kick = useSharedValue(0);               // extra lean in the direction the card is moving
  const punch = useSharedValue(0);              // quick twist when you grab a card
  const phase = useSharedValue(Math.random() * TWO_PI); // where this card is in its idle circle
  const idle = useSharedValue(0);               // how strongly the idle wobble shows: 1 on your turn, 0 otherwise
  const touchX = useSharedValue(0);             // finger position on the card, -1 (left) to 1 (right)
  const touchY = useSharedValue(0);             // -1 (top) to 1 (bottom)
  const pressed = useSharedValue(0);            // 1 while a finger is on the card
  const droop = useSharedValue(0);              // 1 when the player has busted
  const [lifted, setLifted] = useState(false);
  const lastX = useRef<number | null>(null);

  // Once, when the card first appears: fly in, flip over and pop.
  useEffect(() => {
    flip.value = withDelay(140, withTiming(0, { duration: 420 }));
    scale.value = withDelay(60, withSpring(1, POP));
  }, []);

  // The idle wobble only plays for the player whose turn it is, so your eye goes to the right hand.
  // Phase goes round a full circle forever: sine on one tilt axis and cosine on the other
  // makes the card trace a slow circle, like a card floating in 3D.
  useEffect(() => {
    if (active) {
      idle.value = withDelay(400, withTiming(1, { duration: 400 }));
      const start = phase.value;
      phase.value = withDelay(
        400,
        withRepeat(withTiming(start + TWO_PI, { duration: 3600, easing: Easing.linear }), -1, false)
      );
    } else {
      idle.value = withTiming(0, { duration: 300 }); // ease flat...
      cancelAnimation(phase);                        // ...and stop the loop, so idle hands cost nothing
    }
  }, [active]);

  // Whenever the hand changes shape, glide to this card's place in the fan.
  useEffect(() => {
    // A card that is being shoved sideways leans into the move, then rights itself.
    if (lastX.current !== null && lastX.current !== slot.x) {
      const dx = slot.x - lastX.current;
      kick.value = Math.max(-14, Math.min(14, dx * 0.3));
      kick.value = withSpring(0, POP);
    }
    lastX.current = slot.x;
    x.value = withSpring(slot.x, SETTLE);
    y.value = withSpring(slot.lift, SETTLE);
    rot.value = withSpring(slot.rotate, SETTLE);
  }, [slot.x, slot.lift, slot.rotate]);

  useEffect(() => {
    droop.value = withSpring(dead ? 1 : 0, SETTLE);
  }, [dead]);

  // Derived tilt, in degrees. Idle: a small circle. Touched: follows the finger.
  const tiltX = useDerivedValue(
    () => Math.sin(phase.value) * IDLE_TILT * idle.value * (1 - pressed.value) - touchY.value * TOUCH_TILT * pressed.value
  );
  const tiltY = useDerivedValue(
    () => Math.cos(phase.value) * IDLE_TILT * idle.value * (1 - pressed.value) + touchX.value * TOUCH_TILT * pressed.value
  );

  const lean = index % 2 === 0 ? -6 : 6;
  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + Math.sin(phase.value) * 1.5 * idle.value - pressed.value * 14 + droop.value * 6 },
      { rotate: `${rot.value + kick.value + punch.value + droop.value * lean}deg` },
      { scale: scale.value * (1 + pressed.value * 0.18) },
    ],
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
    transform: [{ translateX: CARD_W / 2 - 10 + (tiltY.value / TOUCH_TILT) * CARD_W * 0.7 }, { rotate: "20deg" }],
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
    const nx = (e.nativeEvent.locationX - CARD_W / 2) / (CARD_W / 2);
    const ny = (e.nativeEvent.locationY - CARD_H / 2) / (CARD_H / 2);
    touchX.value = withSpring(Math.max(-1, Math.min(1, nx)), FOLLOW);
    touchY.value = withSpring(Math.max(-1, Math.min(1, ny)), FOLLOW);
  }
  function release() {
    setLifted(false);
    pressed.value = withSpring(0, SETTLE);
    touchX.value = withSpring(0, SETTLE);
    touchY.value = withSpring(0, SETTLE);
  }

  return (
    // Touch and hold a card to lift it and look closer. A lifted card also jumps to the front of the fan.
    <Animated.View style={[styles.slot, { zIndex: lifted ? 50 : index }, motion]}>
      <Animated.View pointerEvents="none" style={[styles.shadow, shadow]} />
      <Animated.View style={[styles.tilt, tilt]}>
        <Animated.View style={[styles.layer, front]}>
          <CardFace card={card} />
          <Animated.View pointerEvents="none" style={[styles.dead, deadShade]} />
          <View pointerEvents="none" style={styles.sheenClip}>
            <Animated.View style={[styles.sheen, sheen]} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.layer, back]}>
          <CardBack />
        </Animated.View>
      </Animated.View>
      {/* A clear layer on top catches the touches, so finger positions are measured against the card itself. */}
      <View
        style={styles.touch}
        accessible
        accessibilityLabel={describeCard(card)}
        onTouchStart={(e: TouchEvent) => {
          setLifted(true);
          pressed.value = withSpring(1, POP);
          punch.value = withSequence(withTiming(-6, { duration: 50 }), withSpring(0, POP));
          aim(e);
        }}
        onTouchMove={aim}
        onTouchEnd={release}
        onTouchCancel={release}
      />
    </Animated.View>
  );
}
