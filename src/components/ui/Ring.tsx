import { memo, useEffect } from "react";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useUi } from "../AppContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size: number;
  stroke: number;
  progress: number;      // 0 (empty) to 1 (full)
  color: string;
  track: string;         // the colour of the part that is not filled
  duration?: number;     // how long the ring takes to move to a new value, in ms
  linear?: boolean;      // move at a steady speed (a clock) instead of easing in and out
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));

// A circle that fills up clockwise from the top: a score on the way to the target, or the turn clock.
export const Ring = memo(function Ring({ size, stroke, progress, color, track, duration = 450, linear = false }: Props) {
  const { reduceMotion } = useUi();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = useSharedValue(clamp(progress));

  useEffect(() => {
    filled.value = reduceMotion || duration <= 0 ? clamp(progress) : withTiming(clamp(progress), linear ? { duration, easing: Easing.linear } : { duration });
  }, [progress, reduceMotion, duration, linear]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - filled.value) }));

  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeLinecap="round"
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
        animatedProps={animatedProps}
      />
    </Svg>
  );
});
