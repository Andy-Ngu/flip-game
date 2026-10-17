import { ReactNode, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { breakdown } from "../../game/breakdown";
import { BustOdds } from "../../game/odds";
import { paced } from "../../game/pace";
import { duplicateIndex } from "../../game/results";
import { scoreHand, uniqueNumberCount } from "../../game/scoring";
import { StageInfo, StageMood } from "../../game/stageInfo";
import { SCORE_NUMBER, TableMetrics } from "../../game/tableMetrics";
import { Card, Player } from "../../game/types";
import { useStyles, useUi } from "../AppContext";
import { Hand } from "../cards/Hand";
import { STAGE_LAYER } from "../layers";
import { hexAlpha } from "../overlays/glow";
import { Palette } from "../theme";
import { Button } from "../ui/Button";
import { VerticalGradient } from "../ui/Gradient";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { BustOddsMeter, SevenStackMeter } from "./Meters";
import { RoundScore } from "./RoundScore";
import { BREAKDOWN_GAP, ScoreBreakdown } from "./ScoreBreakdown";
import { StageAvatar } from "./StageAvatar";
import { StageStatus } from "./StageStatus";
import { makeStyles, STAGE_PAD_X } from "./Stage.styles";
import type { CountView } from "./useTable";
import type { ClockView } from "./useTurnClock";

type Props = {
  player: Player;             // you
  target: number;
  info: StageInfo;
  clock: ClockView | null;    // on your turn
  metrics: TableMetrics;
  odds: BustOdds | null;      // null when the Show bust odds setting is off, or there is nothing to show
  covered: boolean;           // a computer is playing your seat
  onImBack: () => void;
  dealt: boolean;             // false while the round is being set up
  onHoldCard: (card: Card) => void;
  bubble?: ReactNode;         // a chat bubble or emote from you: it sits beside your avatar, never over your cards
  oneAway?: boolean;          // one more different number makes a Seven Stack: the last slot of the meter calls for it
  badge?: number | null;      // the order the round is played in (1 plays first), shown on your avatar while the round starts
  count?: CountView | null;   // your score being counted after you stay: a card lights up, THIS ROUND climbs
  arriveGap?: number;         // cards that come to you in a bunch (Draw Three) arrive one after another, this many milliseconds apart
};

// "How your round scores" closes by itself after this long (before the Game speed setting is applied).
const TIP_MS = 6000;

// Colours of the stage, by what is going on with you.
function accentFor(mood: StageMood, clock: ClockView | null, c: Palette): string {
  if (mood === "bust") return c.danger;
  if (mood === "out") return c.blue;
  if (mood !== "turn") return c.textFaint;
  if (clock?.mood === "critical") return c.danger;
  if (clock?.mood === "low") return c.warn;
  return c.gold;
}

// Your own section of the table. It is always the stage, whoever is playing: your score, your cards,
// how close you are to a Seven Stack and how risky the next card is. Tapping TOTAL SCORE shows how
// your round points add up.
//
// Everything in it is drawn in the order of STAGE_LAYER (components/layers.ts): the bars at the back, then
// your cards, then the header, then the BUST stamp, then the veil and the "How your round scores" card.
// The stage is a layer of its own, so none of those numbers can reach outside it.
export function Stage({ player, target, info, clock, metrics, odds, covered, onImBack, dealt, onHoldCard, bubble, oneAway, badge, count = null, arriveGap = 0 }: Props) {
  const { colors, scale, reduceFlashes, reduceMotion, highContrast, speed } = useUi();
  const styles = useStyles(makeStyles);
  const accent = accentFor(info.mood, clock, colors);
  const mine = info.mood === "turn";
  const bust = info.mood === "bust";

  const points = scoreHand(player);
  const labelW = Math.ceil(96 * scale);
  const dupAt = bust ? duplicateIndex(player.hand) : null;
  const dup = dupAt === null ? undefined : player.hand[dupAt];
  const dupTag = dup && dup.kind === "number" ? `${dup.value} again!` : undefined;

  // The glow around the stage on your turn; with Reduce flashes on it is a plain thicker outline.
  const borderColor = mine ? accent : bust ? colors.danger : colors.border;
  const glow =
    !reduceFlashes && (mine || bust)
      ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 28, color: hexAlpha(mine ? colors.gold : colors.danger, 0.28) }] }
      : null;
  const borderWidth = reduceFlashes && (mine || bust) ? colors.borderWidth + 2 : colors.borderWidth + 0.5;

  // ---------- how your round scores ----------
  // Tap TOTAL SCORE and a card opens under it. It dims the stage behind it and must fit inside the stage:
  // what hangs out of the stage cannot be tapped on Android and would let a tap through to HIT or STAY.
  const [tip, setTip] = useState(false);
  const [held, setHeld] = useState(false);         // the card is taller than the room and you are scrolling it: it stays open
  const [stageH, setStageH] = useState(0);         // how tall the stage is
  const [headBottom, setHeadBottom] = useState(0); // where the header (and so the card) ends, from the top of the stage
  const [hand, setHand] = useState<{ y: number; h: number } | null>(null);   // where the hand's area is, for the BUST stamp
  const [scoresW, setScoresW] = useState(0);       // the two score boxes together
  const [boxW, setBoxW] = useState(0);             // the TOTAL SCORE box
  const explain = useMemo(() => (tip ? breakdown(player) : null), [tip, player]);
  // (headBottom is measured from the stage's outer edge, so only the bottom border is left to take off.)
  const room = stageH > 0 ? Math.max(0, stageH - borderWidth - headBottom - BREAKDOWN_GAP - 8) : 9999;
  const arrowRight = scoresW > 0 && boxW > 0 ? Math.max(0, scoresW - boxW / 2 - 9) : 60;   // 9 = half the arrow

  // It closes by itself (unless you are scrolling it), and when your cards change (the numbers on it would be out of date).
  useEffect(() => {
    if (!tip) {
      setHeld(false);
      return;
    }
    if (held) return;
    const timer = setTimeout(() => setTip(false), paced(TIP_MS, speed));
    return () => clearTimeout(timer);
  }, [tip, held, speed]);
  const handKey = `${player.hand.length}/${player.status}`;
  useEffect(() => {
    setTip(false);
  }, [handKey]);

  // While it is open the TOTAL SCORE box has a cream outline (and glow, unless Reduce flashes is on).
  const spotlight = tip
    ? {
        boxShadow: [
          { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 3, color: colors.text },
          ...(reduceFlashes ? [] : [{ offsetX: 0, offsetY: 0, blurRadius: 16, color: hexAlpha(colors.text, 0.6) }]),
        ],
      }
    : null;

  // The header is two rows and both are full: your avatar (or the turn clock) with TOTAL SCORE and THIS ROUND
  // sharing the rest of the width, and under them a strip as wide as the stage with the words about you.
  const titleColor = mine || bust || info.mood === "out" ? accent : colors.text;
  const avatar = <StageAvatar player={player} target={target} clock={mine ? clock : null} accent={accent} badge={badge} />;
  // While the card is open, everything in the header but the score box is dimmed.
  // (It is above the stage's veil, so a tap on it closes the card too, like a tap on the veil.)
  const dim = tip ? (
    <View style={styles.whoDim} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Tap onPress={() => setTip(false)} label="Close" haptic={null} style={{ flex: 1 }} />
    </View>
  ) : null;

  return (
    <View
      collapsable={false}
      style={[styles.stage, { borderColor, borderWidth, zIndex: 0 }, glow]}
      onLayout={(e: LayoutChangeEvent) => setStageH(e.nativeEvent.layout.height)}
    >
      {highContrast ? null : <VerticalGradient from={colors.surfaceRaised} to={colors.surface} radius={18} />}

      {/* The veil over everything but the header. A tap on it closes the card. */}
      {tip ? (
        <View style={[styles.scrim, { zIndex: STAGE_LAYER.veil }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Tap onPress={() => setTip(false)} label="Close" haptic={null} style={{ flex: 1 }} />
        </View>
      ) : null}

      <View
        style={{ zIndex: tip ? STAGE_LAYER.headerRaised : STAGE_LAYER.header }}
        onLayout={(e: LayoutChangeEvent) => setHeadBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <View>
          <View style={styles.top}>
            <View>
              {avatar}
              {dim}
            </View>

            <View style={styles.scores} onLayout={(e: LayoutChangeEvent) => setScoresW(e.nativeEvent.layout.width)}>
              <Tap
                onPress={() => setTip((open) => !open)}
                label={`Total score ${player.totalScore}`}
                hint={tip ? "Closes how your round scores" : "Shows how your round scores"}
                style={{ flexGrow: 1, flexShrink: 1 }}
              >
                <View style={[styles.totalBox, spotlight]} onLayout={(e: LayoutChangeEvent) => setBoxW(e.nativeEvent.layout.width)}>
                  {/* With bigger text the short word fits where the long one would not (the screen reader says "Total score"). */}
                  <T size={10.5} weight={900} spacing={0.6} lh={1} align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} color={colors.gold}>
                    {scale > 1 ? "TOTAL" : "TOTAL SCORE"}
                  </T>
                  <T size={SCORE_NUMBER(scale)} weight="display" lh={1} color={colors.gold}>{player.totalScore}</T>
                </View>
              </Tap>
              <RoundScore points={points} bust={bust} count={count} />
            </View>
          </View>

          {/* A chat bubble or emote from you sits beside your avatar: centred on the top row, not the whole header. */}
          {bubble ? (
            <View pointerEvents="none" style={styles.bubble}>
              {bubble}
            </View>
          ) : null}
        </View>

        <View style={styles.caption}>
          <StageStatus info={info} color={titleColor} />
          {dim}
        </View>
      </View>

      {/* The card is a child of the stage itself, above the veil: what hangs out of its parent cannot be
          touched on Android (and a card that scrolls could not be dragged). */}
      {explain ? (
        <View style={{ position: "absolute", left: STAGE_PAD_X, right: STAGE_PAD_X, top: headBottom - borderWidth + BREAKDOWN_GAP, zIndex: STAGE_LAYER.breakdown }}>
          <ScoreBreakdown data={explain} maxHeight={room} arrowRight={arrowRight} onClose={() => setTip(false)} onScrollStart={() => setHeld(true)} />
        </View>
      ) : null}

      {/* Your cards. The area is a layer of its own, so a card lifted to the front of the hand only goes in
          front of the other cards, never in front of anything outside the hand. */}
      <View
        collapsable={false}
        style={[styles.handArea, { zIndex: STAGE_LAYER.hand }]}
        onLayout={(e: LayoutChangeEvent) => {
          const { y, height } = e.nativeEvent.layout;
          setHand((prev) => (prev && prev.y === y && prev.h === height ? prev : { y, h: height }));
        }}
      >
        <Hand
          cards={player.hand}
          cardW={metrics.cardW}
          dead={bust}
          active={mine}
          dealt={dealt}
          duplicate={dupAt}
          duplicateTag={dupTag}
          lit={count?.lit ?? null}
          onHold={onHoldCard}
          arriveGap={arriveGap}
        />
      </View>

      {/* BUST, stamped over the middle of the hand: in front of the cards and the header. */}
      {bust ? (
        <View
          collapsable={false}
          pointerEvents="none"
          style={[styles.stampLayer, hand ? { top: hand.y - borderWidth, height: hand.h } : { top: 0, bottom: 0 }, { zIndex: STAGE_LAYER.stamp }]}
        >
          <Animated.View entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(12)}>
            <View style={styles.stamp}>
              <T fixed size={44} weight="display" spacing={4} lh={1.05} color={colors.danger}>BUST</T>
            </View>
          </Animated.View>
        </View>
      ) : null}

      <View collapsable={false} style={[styles.rows, { zIndex: STAGE_LAYER.meters }]}>
        {covered ? (
          <View style={styles.cover}>
            <T size={13} weight={800} color={colors.blue} style={{ flex: 1 }}>A bot is playing for you</T>
            <View style={{ width: 118 }}>
              <Button label="I'm back" size="sm" variant="gold" onPress={onImBack} />
            </View>
          </View>
        ) : (
          <>
            <SevenStackMeter count={uniqueNumberCount(player)} labelW={labelW} pulse={oneAway} />
            {odds ? <BustOddsMeter odds={odds} labelW={labelW} /> : null}
          </>
        )}
      </View>
    </View>
  );
}
