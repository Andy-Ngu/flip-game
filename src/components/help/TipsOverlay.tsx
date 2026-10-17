import { useEffect, useState } from "react";
import { AccessibilityInfo, LayoutChangeEvent, Platform, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Tip, TipId, tipsFor } from "../../game/cardHelp";
import { EDGE, SIDE, TableMetrics } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { useBackButton } from "../useBackButton";

// Where things are on the screen, as distances from the top of the screen. The table screen works
// these out; the tips use them to put a ring around the right part of the table.
export type TipAnchors = {
  dockTop: number;      // the top of the HIT and STAY buttons
  stageTop: number;     // the top and the bottom of your own section of the table
  stageBottom: number;
  tilesTop: number;     // the top and the bottom of the other players' tiles
  tilesBottom: number;
};

type Props = {
  width: number;          // the width of the table's content (the screen, less any notches at the sides)
  anchors: TipAnchors;
  onDone: () => void;     // the last tip was read, or the tips were skipped (or the back button was pressed)
  metrics?: TableMetrics; // optional: with the table's real measurements the ring around HIT is exact
};

type Rect = { x: number; y: number; w: number; h: number; r: number };

// ---------- the look, from the mockup ----------

const DIM = "rgba(8,12,28,0.82)"; // the dimmed table
const RING_WIDTH = 3;
const PANEL_SIDE = 16;            // the tip panel's distance from the left and right edge
const PANEL_GAP = 22;             // between the ring and a panel that sits above it
const CARET = 16;                 // the little square, turned into a point, that aims the panel at the ring
const BIG = 5000;                 // bigger than any screen: the dimmed area is "everything"

// ---------- where the rings go ----------
// The numbers below describe how Dock.tsx and Stage.tsx lay themselves out. If those change, change these.

const RING_PAD = 4;               // the ring stands this far outside the button
const DOCK_GAP = 8;               // between HIT and STAY
const HIT_SHARE = 1.15 / 2.15;    // HIT gets 1.15 parts of the width and STAY gets 1
const STAGE_PAD_BOTTOM = 10;      // the space under the bars inside the stage
const BAR_GAP = 6;                // between the Seven Stack bar and the bust odds bar
const BAR_INSET = 10;             // the ring around a bar starts this far in from the edge of the stage
const BAR_PAD_Y = 5;              // ...and stands this far above and below it

// How tall a bar's row is: its number ("3/7", "19%") is 15 px text with a line height of 1.05,
// made bigger by the Text size setting in the same way the T component does it.
function barHeight(scale: number): number {
  const px = Math.round(15 * scale * 10) / 10;
  return Math.round(px * 1.05 * 10) / 10;
}

type Where = {
  width: number;
  anchors: TipAnchors;
  scale: number;
  swapSides: boolean;
  showBustOdds: boolean;
  borderWidth: number;
  metrics?: TableMetrics;
};

// The height of HIT and STAY. tableMetrics keeps 10, 8 or 6 px between the parts of the table in its
// regular, compact and tight layouts, and the gap between the stage and the dock tells us which one is in use.
function dockMainHeight(w: Where): number {
  if (w.metrics) return w.metrics.dockMain;
  const gap = w.anchors.dockTop - w.anchors.stageBottom;
  const base = gap >= 10 ? 68 : gap >= 8 ? 62 : 56;
  return Math.ceil(Math.max(base, 47 * w.scale + 8));
}

function ringFor(id: TipId, w: Where): Rect {
  if (id === "hit") {
    // HIT is the wider button, on the left unless the buttons have been swapped.
    const dockW = w.width - 2 * SIDE;
    const hitW = (dockW - DOCK_GAP) * HIT_SHARE;
    const stayW = dockW - DOCK_GAP - hitW;
    const x = SIDE + (w.swapSides ? stayW + DOCK_GAP : 0);
    const h = dockMainHeight(w) + EDGE;
    return { x: x - RING_PAD, y: w.anchors.dockTop - RING_PAD, w: hitW + 2 * RING_PAD, h: h + 2 * RING_PAD, r: 18 + RING_PAD };
  }
  // The Seven Stack bar sits above the bust odds bar, at the bottom of the stage.
  const row = barHeight(w.scale);
  const bottom = w.anchors.stageBottom - (w.borderWidth + 0.5) - STAGE_PAD_BOTTOM;
  const oddsTop = bottom - row;
  const top = id === "odds" ? oddsTop : (w.showBustOdds ? oddsTop - BAR_GAP : bottom) - row;
  return { x: SIDE + BAR_INSET, y: top - BAR_PAD_Y, w: w.width - 2 * (SIDE + BAR_INSET), h: row + 2 * BAR_PAD_Y, r: 12 };
}

// A dimmed screen with a rounded hole in it. The big rectangle and the rounded one are drawn as one
// shape with the "even-odd" rule, which leaves the inside of the second one empty.
function dimWithHole(r: Rect): string {
  const rad = Math.min(r.r, r.w / 2, r.h / 2);
  const right = r.x + r.w;
  const bottom = r.y + r.h;
  return [
    `M0 0H${BIG}V${BIG}H0Z`,
    `M${r.x + rad} ${r.y}`,
    `H${right - rad}`, `A${rad} ${rad} 0 0 1 ${right} ${r.y + rad}`,
    `V${bottom - rad}`, `A${rad} ${rad} 0 0 1 ${right - rad} ${bottom}`,
    `H${r.x + rad}`, `A${rad} ${rad} 0 0 1 ${r.x} ${bottom - rad}`,
    `V${r.y + rad}`, `A${rad} ${rad} 0 0 1 ${r.x + rad} ${r.y}`,
    "Z",
  ].join(" ");
}

const clamp = (x: number, low: number, high: number) => Math.min(high, Math.max(low, x));

// ---------- the overlay ----------

// The first-game tips: the table is dimmed, one part of it is ringed in gold, and a short note says
// what it is for. Three tips (two if the bust odds are switched off, as there is no bar to point at).
// Skip is always there, and so is Android's back button.
export function TipsOverlay({ width, anchors, onDone, metrics }: Props) {
  const { colors, reduceMotion, scale, swapSides, showBustOdds } = useUi();
  const window = useWindowDimensions();
  const [measuredH, setMeasuredH] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  const tips = tipsFor(showBustOdds);
  const tip = tips[Math.min(step, tips.length - 1)];
  const last = step >= tips.length - 1;
  const next = () => (last ? onDone() : setStep(step + 1));

  useBackButton(true, () => {
    onDone();
    return true;
  });

  // iPhones read the new tip out loud; Android does it through the live region on the tip's text.
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(`Tip ${step + 1} of ${tips.length}. ${tip.text}`);
  }, [step]);

  const ring = ringFor(tip.id, { width, anchors, scale, swapSides, showBustOdds, borderWidth: colors.borderWidth, metrics });

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(200)}
      exiting={reduceMotion ? undefined : FadeOut.duration(150)}
      style={FILL}
      accessibilityViewIsModal
      onLayout={(e: LayoutChangeEvent) => setMeasuredH(e.nativeEvent.layout.height)}
    >
      {/* Catches every touch, so nothing on the table can be pressed while a tip is up. */}
      <View style={FILL} onStartShouldSetResponder={() => true} />

      <View pointerEvents="none" style={FILL}>
        <Svg width="100%" height="100%">
          <Path d={dimWithHole(ring)} fill={DIM} fillRule="evenodd" />
        </Svg>
      </View>
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: ring.x, top: ring.y, width: ring.w, height: ring.h, borderRadius: ring.r, borderWidth: RING_WIDTH, borderColor: colors.gold }}
      />

      {/* A new panel for each tip, so it measures itself again. */}
      <TipPanel
        key={tip.id}
        tip={tip}
        step={step}
        count={tips.length}
        ring={ring}
        width={width}
        anchors={anchors}
        screenH={measuredH ?? window.height}
        onNext={next}
        onSkip={onDone}
      />
    </Animated.View>
  );
}

// ---------- the note ----------

type PanelProps = {
  tip: Tip;
  step: number;
  count: number;
  ring: Rect;
  width: number;
  anchors: TipAnchors;
  screenH: number;
  onNext: () => void;
  onSkip: () => void;
};

// The cream note with the tip, the dots, Skip tips and Next. It sits over the dimmed dock when the tip
// is about the stage, and above the ring for the HIT tip. If it would not fit below (big text), it goes above.
function TipPanel({ tip, step, count, ring, width, anchors, screenH, onNext, onSkip }: PanelProps) {
  const { colors, reduceMotion } = useUi();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const last = step === count - 1;
  const ink = colors.bg;               // dark writing on the cream note
  const softInk = colors.surfaceRaised;

  const panelW = width - 2 * PANEL_SIDE;
  const room = screenH - insets.bottom - 8 - (anchors.dockTop + 4);
  const below = tip.id !== "hit" && height > 0 && height <= room;
  const top = below ? anchors.dockTop + 4 : Math.max(insets.top + 8, ring.y - PANEL_GAP - height);
  const caretLeft = clamp(ring.x + ring.w / 2 - PANEL_SIDE - CARET / 2, 22, Math.max(22, panelW - 22 - CARET));

  // Nothing shows until the note has been measured, so it never jumps; then it fades in.
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = height === 0 ? 0 : reduceMotion ? 1 : withTiming(1, { duration: 180 });
  }, [height, reduceMotion]);
  const fade = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    <Animated.View
      onLayout={(e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height))}
      style={[
        {
          position: "absolute",
          left: PANEL_SIDE,
          width: panelW,
          top,
          borderRadius: 20,
          backgroundColor: colors.text,
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 10,
          boxShadow: [{ offsetX: 0, offsetY: 14, blurRadius: 30, color: "rgba(0,0,0,0.5)" }],
        },
        fade,
      ]}
    >
      {/* The pointer: a square turned on its corner, half hidden behind the note's edge. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: caretLeft,
          [below ? "top" : "bottom"]: -CARET / 2,
          width: CARET,
          height: CARET,
          backgroundColor: colors.text,
          transform: [{ rotate: "45deg" }],
        }}
      />

      <View accessibilityLiveRegion="polite">
        <T size={15} weight={800} lh={1.35} color={ink}>{tip.text}</T>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: 8, rowGap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length: count }, (_, i) => (
              <View key={i} style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: ink, opacity: i === step ? 1 : 0.25 }} />
            ))}
          </View>
          <T size={12} weight={800} color={softInk} style={{ marginLeft: 6 }}>{`${step + 1} of ${count}`}</T>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Tap onPress={onSkip} label="Skip tips">
            <View style={{ minHeight: 48, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }}>
              <T size={13} weight={900} color={softInk}>Skip tips</T>
            </View>
          </Tap>
          <Tap onPress={onNext} label={last ? "Got it" : "Next tip"}>
            {(pressed) => (
              <View
                style={{
                  minHeight: 48,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: ink,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                <T size={16} weight="display" spacing={1} lh={1} color={colors.gold}>{last ? "GOT IT" : "NEXT"}</T>
              </View>
            )}
          </Tap>
        </View>
      </View>
    </Animated.View>
  );
}
