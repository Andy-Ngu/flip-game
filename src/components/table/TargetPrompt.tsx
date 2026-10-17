import { useEffect, useState } from "react";
import { AccessibilityInfo, LayoutChangeEvent, Platform, View } from "react-native";
import Animated, { Easing, FadeIn, useSharedValue, withTiming } from "react-native-reanimated";
import { scoreHand } from "../../game/scoring";
import { Density, TableMetrics } from "../../game/tableMetrics";
import { Player } from "../../game/types";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { CardFace } from "../cards/CardFace";
import { FillBar } from "../ui/FillBar";
import { VerticalGradient } from "../ui/Gradient";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { PickGlow, PickTag } from "./PickMarks";
import type { ClockView } from "./useTurnClock";

// You drew a card that needs a player picked (Time Out, Draw Three, or a spare Shield). While you
// choose, this replaces your stage: a panel that says what the card does, a row for picking yourself,
// and the clock for the choice. The other players are the tiles above: the ones you can pick light up.
// The wording and the sizes are the TargetPick board.

type Kind = "timeOut" | "drawThree" | "shield";

type Props = {
  card: Kind;
  player: Player;           // you
  target: number;
  clock: ClockView | null;  // the clock for this choice; the first one picked for you when it reaches 0
  canPickSelf: boolean;     // you may give the card to yourself
  onPickSelf: () => void;
  metrics: TableMetrics;
};

// (`title` is just the name of the card, and `sub` is one short sentence about what it does. `lead` and `ask`
// are what a screen reader hears.)
const COPY: Record<Kind, { eyebrow: string; title: string; sub: string; lead: string; ask: string }> = {
  timeOut: {
    eyebrow: "YOU DREW",
    title: "TIME OUT",
    sub: "They stop drawing this round but keep their points.",
    lead: "You drew Time Out.",
    ask: "Who gets Time Out?",
  },
  drawThree: {
    eyebrow: "YOU DREW",
    title: "DRAW THREE",
    sub: "They draw 3 cards. A duplicate busts them.",
    lead: "You drew Draw Three.",
    ask: "Who draws three?",
  },
  shield: {
    eyebrow: "YOU ALREADY HAVE A SHIELD",
    title: "PASS THE SPARE",
    sub: "A Shield blocks one duplicate. Give this one to a player who has none.",
    lead: "You already have a Shield.",
    ask: "Pass the spare.",
  },
};

// The board is drawn at the regular size. The smaller layouts of a crowded table or a small phone shrink
// the card and the gaps in the same proportions.
type Size = { cardW: number; padH: number; padV: number; gap: number; between: number; after: number; you: number; avatar: number; title: number };
const SIZES: Record<Density, Size> = {
  regular: { cardW: 72, padH: 14, padV: 12, gap: 14, between: 10, after: 16, you: 58, avatar: 36, title: 23 },
  compact: { cardW: 64, padH: 12, padV: 10, gap: 12, between: 8, after: 12, you: 52, avatar: 34, title: 21 },
  tight: { cardW: 56, padH: 10, padV: 8, gap: 10, between: 6, after: 8, you: 46, avatar: 30, title: 19 },
};

// The bar under the clock: a track that a gold bar empties along, steadily between two ticks.
function ClockBar({ ring, ringMs, color }: { ring: number; ringMs: number; color: string }) {
  const { colors, reduceMotion } = useUi();
  const to = Math.min(1, Math.max(0, ring));
  const filled = useSharedValue(to);

  useEffect(() => {
    filled.value = reduceMotion || ringMs <= 0 ? to : withTiming(to, { duration: ringMs, easing: Easing.linear });
  }, [to, ringMs, reduceMotion]);

  return <FillBar progress={filled} color={color} track={colors.bg} height={8} />;
}

export function TargetPrompt({ card, player, target, clock, canPickSelf, onPickSelf, metrics }: Props) {
  const { colors, scale, highContrast, reduceMotion, reduceFlashes } = useUi();
  const copy = COPY[card];
  const sz = SIZES[metrics.density];
  const accent = card === "shield" ? colors.good : colors.gold;
  const clockColor = clock?.mood === "critical" ? colors.danger : clock?.mood === "low" ? colors.warn : colors.gold;
  const points = scoreHand(player);
  const spoken = `${copy.lead} ${copy.ask} ${copy.sub}`;

  // Everything has to fit the room the stage leaves, however big the text is set. If it does not, the
  // wording gets shorter, a step at a time: the explanation first at two lines, then not at all.
  // Each step is drawn as a new view, so it always reports its own height; a height that comes from a step
  // that is no longer showing is ignored. A new card, room, density or text size starts again at step 0.
  const [room, setRoom] = useState(0);
  const signature = `${card}|${Math.round(room)}|${metrics.density}|${scale}`;
  const [fit, setFit] = useState({ sig: signature, step: 0 });
  const step = fit.sig === signature ? fit.step : 0;
  function measured(height: number, at: number) {
    setFit((prev) => {
      const base = prev.sig === signature ? prev : { sig: signature, step: 0 };
      if (base.step !== at) return base;
      return room > 0 && height > room + 0.5 && base.step < 2 ? { sig: signature, step: base.step + 1 } : base;
    });
  }

  // iPhones need to be told what is being asked; Android reads out the live region by itself.
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(spoken);
  }, [card]);

  const note = canPickSelf ? "Tap to give it to yourself" : card === "shield" ? "You already have a Shield" : "You can't pick yourself";
  const noteColor = canPickSelf ? colors.textDim : card === "shield" ? colors.good : colors.textFaint;
  const youBorder = canPickSelf && reduceFlashes ? colors.borderWidth + 1.5 : colors.borderWidth;

  const youBody = (
    <>
      <Avatar look={player.look} size={sz.avatar} ring={{ progress: target > 0 ? player.totalScore / target : 0, color: colors.gold, track: colors.border }} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <T size={14} weight={800} lh={1.05} numberOfLines={1} style={{ flexShrink: 1 }}>{player.name}</T>
          <T size={14} weight={800} lh={1.05} color={colors.gold} style={{ flexShrink: 0 }}>{" (you)"}</T>
        </View>
        <T size={11.5} weight={800} lh={1.1} color={noteColor} numberOfLines={2}>{note}</T>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <T size={20} weight="display" lh={1}>{player.totalScore}</T>
        <T size={11.5} weight={900} lh={1} color={colors.gold}>{`+${points}`}</T>
      </View>
      {canPickSelf ? <PickTag large /> : null}
    </>
  );

  const youStyle = {
    minHeight: sz.you,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: youBorder,
    borderColor: canPickSelf ? colors.gold : colors.border,
    backgroundColor: colors.surface,
    opacity: canPickSelf ? 1 : 0.5,
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(160)}
      onLayout={(e: LayoutChangeEvent) => setRoom(e.nativeEvent.layout.height)}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <View key={`${signature}|${step}`} onLayout={(e: LayoutChangeEvent) => measured(e.nativeEvent.layout.height, step)}>
        {/* What the card does. */}
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={spoken}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: sz.gap,
            paddingHorizontal: sz.padH,
            paddingVertical: sz.padV,
            borderRadius: 20,
            borderWidth: colors.borderWidth + 0.5,
            borderColor: accent,
            backgroundColor: colors.surface,
            boxShadow: [{ offsetX: 0, offsetY: 12, blurRadius: 24, color: "rgba(0,0,0,0.4)" }],
          }}
        >
          {highContrast ? null : <VerticalGradient from={colors.surfaceRaised} to={colors.surface} radius={17} />}
          <View style={{ transform: [{ rotate: "-5deg" }], boxShadow: [{ offsetX: 0, offsetY: 7, blurRadius: 14, color: "rgba(0,0,0,0.4)" }] }}>
            <CardFace card={{ kind: "action", action: card }} width={sz.cardW} highContrast={highContrast} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <T size={10.5} weight={900} spacing={1.2} lh={1} color={colors.textFaint} numberOfLines={1}>{copy.eyebrow}</T>
            <T size={sz.title} weight="display" spacing={0.5} lh={1.05} color={accent} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              {copy.title}
            </T>
            {step < 2 ? (
              <T size={12.5} weight={700} lh={1.3} color={colors.textDim} numberOfLines={step === 1 ? 2 : undefined}>{copy.sub}</T>
            ) : null}
          </View>
        </View>

        {/* You, as a player to pick. */}
        <View style={{ marginTop: sz.between }}>
          {canPickSelf ? (
            <Tap
              onPress={onPickSelf}
              label={`You, ${player.name}. ${pointsText(player.totalScore)} in total, ${pointsText(points)} this round.`}
              hint="Gives the card to yourself"
            >
              {(pressed) => (
                <View style={[youStyle, pressed ? { backgroundColor: colors.surfaceRaised } : null]}>
                  <PickGlow radius={16} />
                  {youBody}
                </View>
              )}
            </Tap>
          ) : (
            <View accessible accessibilityLabel={`You, ${player.name}. ${note}.`} style={youStyle}>
              {youBody}
            </View>
          )}
        </View>

        {/* The clock for the choice. */}
        <View
          accessible
          accessibilityRole="timer"
          // (The screen says only "Tap a player"; a screen reader is also told what happens when the clock runs out.)
          accessibilityLabel={clock ? `${clock.secondsLeft} seconds left to pick. At zero one is picked for you.` : "Pick a player."}
          style={{ marginTop: sz.after, gap: 7, paddingHorizontal: 4 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <T
              size={12}
              weight={800}
              lh={1.2}
              color={colors.textDim}
              style={{ flex: 1 }}
              numberOfLines={step >= 1 ? 1 : undefined}
              adjustsFontSizeToFit={step >= 1}
              minimumFontScale={0.75}
            >
              Tap a player
            </T>
            {clock ? <T size={18} weight="display" lh={1} color={clockColor}>{`${clock.secondsLeft}s`}</T> : null}
          </View>
          {clock ? <ClockBar ring={clock.ring} ringMs={clock.ringMs} color={clockColor} /> : null}
        </View>
      </View>
    </Animated.View>
  );
}
