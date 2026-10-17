import { useEffect, useState } from "react";
import { AccessibilityInfo, LayoutChangeEvent, Platform, ScrollView, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Breakdown, breakdownSpeech } from "../../game/breakdown";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";

// "HOW YOUR ROUND SCORES": the little cream card that opens under your TOTAL SCORE. It lists how the
// round points add up (see game/breakdown.ts). The stage puts it just under the box it belongs to, as
// wide as the stage's contents, and the card has an arrow up to the box.

// The type sizes. The first row of this list is the Clarity board. When the stage is too short to show
// all of that, the sizes step down, then the small print goes, then the title, then the padding, until it
// fits. If even the last row is taller than the room (the biggest text, a short stage and a long list)
// the card scrolls.
type Step = { title: number; row: number; value: number; total: number; note: number; pad: number; gap: number; showTitle: boolean; showNote: boolean };
const COMPACT = { title: 15, row: 12.5, value: 14.5, total: 22, note: 11, pad: 10, gap: 5 };
const STEPS: Step[] = [
  { title: 18, row: 13.5, value: 16, total: 26, note: 12, pad: 14, gap: 8, showTitle: true, showNote: true },
  { ...COMPACT, showTitle: true, showNote: true },
  { ...COMPACT, showTitle: true, showNote: false },
  { ...COMPACT, showTitle: false, showNote: false },
  { ...COMPACT, pad: 6, gap: 3, showTitle: false, showNote: false },
];

const ARROW = 18;
export const BREAKDOWN_GAP = 9;   // between the score box and the card

// The one fixed colour: the red of a bust on the paper. The palette's reds are made for the dark table
// (too pale to read on cream), so this is a deep red fixed like the ink of a card face. It stays above 4.5:1.
const BUST_INK = "#B3232B";
const BUST_INK_HC = "#8A0F18";

type Props = {
  data: Breakdown;
  maxHeight: number;    // the room the stage leaves under the score box
  arrowRight: number;   // how far the arrow is from the right edge of the card: it points at the middle of the score box
  onClose: () => void;
  onScrollStart?: () => void;   // the card is taller than the room and the player began to scroll it (the stage may keep it open longer)
};

// Which sizes are showing, and whether they have been measured. It belongs to one `signature` (what the card
// says and how much room it has): a new one starts again from the biggest sizes.
type Fit = { sig: string; step: number; ready: boolean; height: number };
const fresh = (sig: string): Fit => ({ sig, step: 0, ready: false, height: 0 });

export function ScoreBreakdown({ data, maxHeight, arrowRight, onClose, onScrollStart }: Props) {
  const { colors, highContrast, reduceMotion } = useUi();
  const speech = breakdownSpeech(data);

  // The card is cream paper with dark writing, whatever the table looks like. The palette's own colours
  // are used for the paper, the writing, the small print (its mid navy) and the line above the total.
  const paper = colors.text;
  const ink = colors.bg;
  const soft = highContrast ? colors.bg : colors.border;
  const rule = highContrast ? colors.bg : colors.textDim;
  const bad = highContrast ? BUST_INK_HC : BUST_INK;

  const signature = `${data.lines.map((l) => `${l.label}|${l.value}`).join(";")}|${data.note}|${Math.round(maxHeight)}`;
  const [stored, setStored] = useState<Fit>(() => fresh(signature));
  const fit = stored.sig === signature ? stored : fresh(signature);
  const s = STEPS[fit.step];
  const scrolls = fit.step === STEPS.length - 1 && fit.height > maxHeight + 0.5;

  // The list is measured at each size (it is drawn again, as a new view, so there is always a fresh measurement).
  // If it is taller than the room the next size down is tried. A measurement of a size that is no longer showing
  // is ignored. It stays hidden until it is known which size fits.
  const at = fit.step;
  function measured(e: LayoutChangeEvent) {
    const height = e.nativeEvent.layout.height;
    setStored((prev) => {
      const base = prev.sig === signature ? prev : fresh(signature);
      if (base.step !== at) return base;
      if (height > maxHeight + 0.5 && base.step < STEPS.length - 1) return { ...base, step: base.step + 1, ready: false, height };
      return { ...base, ready: true, height };
    });
  }

  // If no measurement ever comes, it shows itself anyway after a moment.
  useEffect(() => {
    const timer = setTimeout(() => {
      setStored((prev) => {
        const base = prev.sig === signature ? prev : fresh(signature);
        return base.step === at ? { ...base, ready: true } : base;
      });
    }, 160);
    return () => clearTimeout(timer);
  }, [signature, at]);

  // iPhones need to be told; Android reads out the live region by itself.
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(speech);
  }, [signature]);

  const rows = data.lines.slice(0, -1);
  const total = data.lines[data.lines.length - 1];

  const list = (
    <View
      key={`${signature}|${fit.step}`}
      onLayout={measured}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={speech}
      style={{ paddingHorizontal: s.pad + 2, paddingVertical: s.pad, gap: s.gap }}
    >
      {s.showTitle ? (
        <T size={s.title} weight="display" spacing={0.8} lh={1} color={ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          HOW YOUR ROUND SCORES
        </T>
      ) : null}

      {rows.map((line, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <T size={s.row} weight={800} lh={1.25} color={ink} style={{ flex: 1 }}>{line.label}</T>
          <T size={s.value} weight="display" lh={1.1} color={line.kind === "bust" ? bad : ink} style={{ flexShrink: 0 }}>{line.value}</T>
        </View>
      ))}

      <View style={{ height: 2, backgroundColor: rule }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <T size={s.row} weight={900} lh={1.2} color={ink} style={{ flex: 1 }}>{total.label}</T>
        <T size={s.total} weight="display" lh={1.1} color={ink} style={{ flexShrink: 0 }}>{total.value}</T>
      </View>

      {s.showNote ? <T size={s.note} weight={700} lh={1.3} color={soft}>{data.note}</T> : null}
    </View>
  );

  // A tap anywhere on the card closes it (inside the scroll view when it scrolls, so a drag still scrolls).
  const closer = <Tap onPress={onClose} label="Close" hint="Closes how your round scores" haptic={null} style={FILL} />;

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(180)}>
      <View
        style={{
          maxHeight,
          overflow: "hidden",
          borderRadius: 18,
          backgroundColor: paper,
          opacity: fit.ready ? 1 : 0,
          boxShadow: [{ offsetX: 0, offsetY: 14, blurRadius: 30, color: "rgba(0,0,0,0.5)" }],
        }}
      >
        {scrolls ? (
          <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator persistentScrollbar nestedScrollEnabled onScrollBeginDrag={onScrollStart}>
            {list}
            {closer}
          </ScrollView>
        ) : (
          <>
            {list}
            {closer}
          </>
        )}
      </View>

      {/* The arrow, drawn after the card so the card's shadow does not dirty it. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: "absolute",
          top: -ARROW / 2,
          right: arrowRight,
          width: ARROW,
          height: ARROW,
          borderRadius: 3,
          backgroundColor: paper,
          opacity: fit.ready ? 1 : 0,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </Animated.View>
  );
}
