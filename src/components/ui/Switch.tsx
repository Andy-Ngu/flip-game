import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useUi } from "../AppContext";
import { Tap } from "./Tap";

type Props = { value: boolean; onChange: (value: boolean) => void; label: string };

const KNOB_LEFT = 3;   // where the knob sits when the switch is off
const KNOB_SLIDE = 21; // how far it slides to the right when the switch is on

// An on/off switch with a big touch area (56 by 48) around the small track.
export function Switch({ value, onChange, label }: Props) {
  const { colors, reduceMotion } = useUi();
  const knob = useSharedValue(value ? KNOB_SLIDE : 0);

  useEffect(() => {
    const to = value ? KNOB_SLIDE : 0;
    knob.value = reduceMotion ? to : withTiming(to, { duration: 140 });
  }, [value, reduceMotion]);

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: knob.value }] }));

  return (
    <Tap role="switch" checked={value} label={label} onPress={() => onChange(!value)} haptic="tick" style={{ width: 56, height: 48, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          borderWidth: 2,
          backgroundColor: value ? colors.gold : colors.bg,
          borderColor: value ? colors.gold : colors.textFaint,
        }}
      >
        <Animated.View
          style={[{ position: "absolute", left: KNOB_LEFT, top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: value ? colors.onGold : colors.textDim }, knobStyle]}
        />
      </View>
    </Tap>
  );
}
