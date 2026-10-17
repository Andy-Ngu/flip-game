import { ReactNode, useEffect } from "react";
import { View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { useUi } from "../AppContext";
import { playFeel } from "../haptics";
import { hexAlpha } from "../overlays/glow";
import { T } from "../ui/T";

// The logo is three navy cards that start in a pile and fan open, a big gold 7 on the front one,
// and the name underneath. The two blue-grey edges are part of the artwork (like the app icon), so
// they are fixed colours rather than palette colours.
const EDGE_BACK = "#5B6BA0";
const EDGE_MIDDLE = "#9AA6D0";

const LOGO_W = 96;
const LOGO_H = 112;
const CARD_W = 62;
const CARD_H = 92;

// Where the middle card sits. The other two start there and slide out to their own places.
const MID_LEFT = 14;
const MID_TOP = 8;

export function TitleScreenLogo() {
  const { colors, reduceMotion, reduceFlashes, vibration, speed } = useUi();
  const open = useSharedValue(reduceMotion ? 1 : 0);   // 0: the cards are in a pile, 1: fanned open
  const rise = useSharedValue(reduceMotion ? 1 : 0);   // 0: low and invisible, 1: in place
  const wiggle = useSharedValue(0);                    // a little twist when the logo is touched

  useEffect(() => {
    if (reduceMotion) {
      open.value = 1;
      rise.value = 1;
      return;
    }
    rise.value = withDelay(paced(150, speed), withSpring(1, { damping: 14, stiffness: 110 }));
    open.value = withDelay(paced(550, speed), withSpring(1, { damping: 11, stiffness: 90 }));
  }, [reduceMotion]);

  const whole = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 2),
    transform: [{ translateY: (1 - rise.value) * 40 }, { rotate: `${wiggle.value}deg` }],
  }));

  // Touching the logo gives it a small shake and a faint tick. It is only for fun, so screen readers
  // are not told about it (the logo is read out as a heading below).
  function poke() {
    if (vibration) playFeel("tick");
    if (reduceMotion) return;
    wiggle.value = withSequence(withTiming(-5, { duration: paced(70, speed) }), withSpring(0, { damping: 6, stiffness: 140 }));
  }

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Stack Seven. Push your luck. Collect seven."
      style={{ alignItems: "center", gap: 6 }}
    >
      <Animated.View onTouchStart={poke} style={[{ width: LOGO_W, height: LOGO_H, marginBottom: 6 }, whole]}>
        <FanCard left={26} top={0} angle={12} open={open} background={colors.surface} border={EDGE_BACK} />
        <FanCard left={14} top={8} angle={0} open={open} background={colors.surface} border={EDGE_MIDDLE} />
        <FanCard left={2} top={16} angle={-12} open={open} background={colors.bg} border={colors.gold} glow={!reduceFlashes}>
          <T fixed size={56} weight="display" lh={1} color={colors.gold}>7</T>
        </FanCard>
      </Animated.View>

      <Wordmark text="STACK" color={colors.gold} edge={colors.goldDark} />
      <Wordmark text="SEVEN" color={colors.text} edge={EDGE_BACK} />
      <T size={14} weight={800} spacing={0.5} color={colors.textDim} align="center" style={{ marginTop: 8 }}>
        Push your luck. Collect seven.
      </T>
    </View>
  );
}

type WordmarkProps = { text: string; color: string; edge: string };

// One big word of the name. The darker "edge" is the same word drawn 4 px lower underneath, which gives
// the chunky raised look. (Two copies are used instead of a text shadow, because a shadow with no blur
// is not drawn on every Android phone.)
function Wordmark({ text, color, edge }: WordmarkProps) {
  return (
    <View style={{ marginBottom: 4 }}>
      <T fixed size={60} weight="display" spacing={3} lh={0.95} color={edge} style={{ position: "absolute", top: 4, left: 0, right: 0, textAlign: "center" }}>{text}</T>
      <T fixed size={60} weight="display" spacing={3} lh={0.95} color={color}>{text}</T>
    </View>
  );
}

type FanCardProps = {
  left: number;                // where the card ends up, inside the 96 by 112 logo box
  top: number;
  angle: number;               // how far it ends up tilted, in degrees
  open: SharedValue<number>;   // 0 to 1: how far the fan has opened
  background: string;
  border: string;
  glow?: boolean;              // a soft gold glow behind the card
  children?: ReactNode;
};

// One card of the logo. It starts on top of the middle card and slides and turns out to its own place as `open` goes to 1.
function FanCard({ left, top, angle, open, background, border, glow, children }: FanCardProps) {
  const { colors } = useUi();
  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: (left - MID_LEFT) * open.value },
      { translateY: (top - MID_TOP) * open.value },
      { rotate: `${angle * open.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: MID_LEFT,
          top: MID_TOP,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 10,
          borderWidth: 3,
          borderColor: border,
          backgroundColor: background,
          alignItems: "center",
          justifyContent: "center",
        },
        glow ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 24, color: hexAlpha(colors.gold, 0.4) }] } : null,
        motion,
      ]}
    >
      {children}
    </Animated.View>
  );
}
