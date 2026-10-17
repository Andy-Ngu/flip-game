import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { PlayedView } from "../../game/played";
import { useStyles, useUi } from "../AppContext";
import { CardFace, cardHeight } from "../cards/CardFace";
import { FILL } from "../fill";
import { Panel } from "../ui/Panel";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { makeStyles } from "./PlayedOnYou.styles";

const CARD_W = 72;
const APPEAR_MS = 140;   // the panel fades and grows in
const LAND_MS = 220;     // the card drops onto the table
const WORDS_MS = 160;    // the words fade in once the card has landed

type Props = {
  view: PlayedView;          // what to say (see game/played.ts)
  onDone?: () => void;       // the panel was tapped: the table carries on
};

// Shown in the middle of the table when a computer player plays a card on YOU: "GUS PLAYED / [card] /
// DRAW THREE ON YOU / You draw 3 cards." The game waits behind it, so the card never does anything to you before
// you have been told. A bad card (Draw Three, Time Out) has a red edge, a gift (a spare Shield) a green one.
// Show it with a `key` that changes for every message, so each one starts from the beginning.
// Only the panel takes a touch (it carries on); the rest of the table stays as it is.
export function PlayedOnYou({ view, onDone }: Props) {
  const { colors, highContrast, reduceMotion, speed } = useUi();
  const styles = useStyles(makeStyles);
  const p = (ms: number) => paced(ms, speed);
  const accent = view.good ? colors.good : colors.danger;

  const appear = useSharedValue(0);                       // the whole panel fading and growing in
  const drop = useSharedValue(reduceMotion ? 0 : 1);      // 1: the card is big and tilted, above its place; 0: it has landed
  const hit = useSharedValue(0);                          // the ring growing out of the card when it lands (0 to 1)

  useEffect(() => {
    if (reduceMotion) {
      appear.value = withTiming(1, { duration: p(150) });
      return;
    }
    appear.value = withTiming(1, { duration: p(APPEAR_MS) });
    drop.value = withDelay(p(APPEAR_MS), withTiming(0, { duration: p(LAND_MS), easing: Easing.in(Easing.cubic) }));
    hit.value = withDelay(p(APPEAR_MS + LAND_MS), withTiming(1, { duration: p(520) }));
  }, []);

  const panelMotion = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: reduceMotion ? 1 : 0.8 + 0.2 * appear.value }],
  }));
  const cardMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -drop.value * 26 }, { scale: 1 + drop.value * 0.35 }, { rotate: `${drop.value * -14}deg` }],
  }));
  const ringMotion = useAnimatedStyle(() => ({
    opacity: hit.value === 0 ? 0 : (1 - hit.value) * 0.9,
    transform: [{ scale: 1 + hit.value * 0.7 }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View accessible accessibilityLiveRegion="polite" accessibilityLabel={view.spoken} style={[panelMotion, styles.sized]}>
        <Panel tone="raised" outline={accent} radius={16} style={styles.panel}>
          <T size={13} weight={900} spacing={2.2} lh={1.1} color={colors.textDim} align="center" numberOfLines={1}>{view.top}</T>

          <Animated.View style={[{ width: CARD_W, height: cardHeight(CARD_W) }, cardMotion]}>
            <CardFace card={view.card} width={CARD_W} highContrast={highContrast} />
            {reduceMotion ? null : <Animated.View style={[styles.ring, { borderColor: accent }, ringMotion]} />}
          </Animated.View>

          <Animated.View entering={FadeIn.delay(p(reduceMotion ? 150 : APPEAR_MS + LAND_MS)).duration(p(WORDS_MS))} style={styles.words}>
            <T size={22} weight="display" spacing={1.5} lh={1.1} color={accent} align="center">{view.heading}</T>
            <T size={14} weight={800} lh={1.3} color={colors.textDim} align="center">{view.effect}</T>
          </Animated.View>
        </Panel>
        {onDone ? <Tap onPress={onDone} label="Close message" haptic={null} style={FILL} /> : null}
      </Animated.View>
    </View>
  );
}
