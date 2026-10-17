import { ReactNode } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { Tap } from "./Tap";

type Props = {
  onPress?: () => void;   // tapping the dark area calls this (to close what is on top); leave out to make it do nothing
  strength?: number;      // how dark, 0 to 1
  label?: string;         // what a screen reader says for the dark area when it can be tapped
  children?: ReactNode;
};

// The dark veil behind a dialog, a sheet or a popup. It covers its whole parent and fades in and out.
// Whatever is passed as children sits on top of the veil and takes its own touches.
export function Dim({ onPress, strength = 0.7, label = "Close", children }: Props) {
  const { reduceMotion } = useUi();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(160)}
      exiting={reduceMotion ? undefined : FadeOut.duration(120)}
      style={[FILL, { backgroundColor: `rgba(8,12,28,${strength})` }]}
    >
      {onPress ? <Tap onPress={onPress} label={label} haptic={null} style={FILL} /> : null}
      {children}
    </Animated.View>
  );
}
