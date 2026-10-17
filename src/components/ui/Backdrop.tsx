import { memo } from "react";
import { View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useUi } from "../AppContext";
import { FILL } from "../fill";

// The soft glow behind every screen: lighter in the middle, deep navy at the edges.
// With high contrast on it is one flat colour.
export const Backdrop = memo(function Backdrop({ centerY = 0.45 }: { centerY?: number }) {
  const { colors, highContrast } = useUi();
  if (highContrast) return <View pointerEvents="none" style={[FILL, { backgroundColor: colors.bg }]} />;
  return (
    <View pointerEvents="none" style={FILL}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="0.5" cy={centerY} rx="1.2" ry="0.7" fx="0.5" fy={centerY} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor="#26335F" />
            <Stop offset="0.6" stopColor={colors.bg} />
            <Stop offset="1" stopColor={colors.bgDeep} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
});
