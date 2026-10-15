import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { faceFor } from "../game/cardFace";
import { playFeel } from "./haptics";
import { FAN_PIVOT, styles } from "./TitleScreen.styles";

// The logo: three number cards in the colors of the risk tiers, the last one a 7.
const LOGO_CARDS = [
  { value: 3, angle: -22, front: false },
  { value: 5, angle: -8, front: false },
  { value: 7, angle: 8, front: true },
] as const;

const OPEN = { damping: 12, stiffness: 90 };

export default function TitleScreen({ onPlay, onRules }: { onPlay: () => void; onRules: () => void }) {
  const float = useSharedValue(0);   // the whole logo drifts up and down, slowly
  const wiggle = useSharedValue(0);  // a little twist when you tap the logo
  const pulse = useSharedValue(1);   // the Play button breathes

  useEffect(() => {
    float.value = withDelay(
      1400,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    pulse.value = withDelay(
      1800,
      withRepeat(withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 14 }, { translateY: float.value * 8 - 4 }, { rotate: `${wiggle.value}deg` }],
  }));
  const playStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  function poke() {
    playFeel("tick");
    wiggle.value = withSequence(
      withTiming(-5, { duration: 70 }),
      withSpring(0, { damping: 6, stiffness: 140 })
    );
  }

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.glowOuter} />
      <View pointerEvents="none" style={styles.glowInner} />

      <Pressable onPress={poke} accessibilityLabel="Stack Seven logo">
        <Animated.View style={[styles.logo, logoStyle]}>
          {LOGO_CARDS.map((c, i) => (
            <LogoCard key={c.value} value={c.value} angle={c.angle} front={c.front} order={i} />
          ))}
        </Animated.View>
      </Pressable>

      <View style={styles.titleBlock}>
        <Animated.Text
          allowFontScaling={false}
          entering={FadeInDown.delay(750).duration(500).springify()}
          style={styles.titleTop}
        >
          STACK
        </Animated.Text>
        <Animated.Text
          allowFontScaling={false}
          entering={FadeInDown.delay(900).duration(500).springify()}
          style={styles.titleBottom}
        >
          SEVEN
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(1100).duration(500)} style={styles.tagline}>
          Push your luck. Collect seven.
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(1250).duration(500)} style={styles.playWrap}>
        <Animated.View style={playStyle}>
          <Pressable
            style={styles.play}
            accessibilityRole="button"
            accessibilityLabel="Play"
            onPress={() => {
              playFeel("light");
              onPlay();
            }}
          >
            <Text allowFontScaling={false} style={styles.playText}>PLAY</Text>
          </Pressable>
        </Animated.View>
        <Pressable style={styles.rulesLink} accessibilityRole="button" onPress={onRules}>
          <Text allowFontScaling={false} style={styles.rulesText}>HOW TO PLAY</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.footer}>3 to 8 players · pass and play · computer opponents</Text>
    </View>
  );
}

type LogoCardProps = { value: number; angle: number; front: boolean; order: number };

// One card of the logo. It rises into view, then fans open from a point below the card,
// the way you open a hand of cards.
function LogoCard({ value, angle, front, order }: LogoCardProps) {
  const face = faceFor({ kind: "number", value });
  const rise = useSharedValue(0); // 0: below the screen and invisible, 1: in place
  const open = useSharedValue(0); // 0: stacked, 1: fanned out

  useEffect(() => {
    rise.value = withDelay(150 + order * 130, withSpring(1, { damping: 13, stiffness: 110 }));
    open.value = withDelay(650, withSpring(1, OPEN));
  }, []);

  const motion = useAnimatedStyle(() => {
    const a = (angle * open.value * Math.PI) / 180; // current angle in radians
    return {
      opacity: Math.min(1, rise.value * 2),
      transform: [
        { translateX: FAN_PIVOT * Math.sin(a) },
        { translateY: (1 - rise.value) * 260 + FAN_PIVOT * (1 - Math.cos(a)) },
        { rotate: `${angle * open.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.logoCard, { backgroundColor: face.bg, borderColor: face.accent }, motion]}
    >
      <View style={[styles.logoInner, { borderColor: face.accent + "59" }]} />
      {front && (
        <Text allowFontScaling={false} style={[styles.logoSeven, { color: face.accent }]}>
          {value}
        </Text>
      )}
    </Animated.View>
  );
}
