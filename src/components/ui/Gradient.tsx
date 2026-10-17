import { useId } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { FILL } from "../fill";

type Props = { from: string; to: string; radius?: number };

// A colour that fades from the top of its parent to the bottom. It sits behind the parent's content.
export function VerticalGradient({ from, to, radius = 0 }: Props) {
  const id = "vg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <View pointerEvents="none" style={[FILL, { borderRadius: radius, overflow: "hidden" }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
