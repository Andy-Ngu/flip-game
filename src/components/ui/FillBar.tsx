import { StyleProp, View, ViewStyle, LayoutChangeEvent } from "react-native";
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

type Props = {
  progress: SharedValue<number>;   // how full the bar is, 0 (empty) to 1 (full)
  color: string;                   // the filled part
  track: string;                   // the empty part behind it
  height: number;
  style?: StyleProp<ViewStyle>;    // anything else the track needs (a border, a margin, a stretch)
};

// A progress bar that fills from the left. The coloured part is as wide as the track all the time and
// slides in from the left, so nothing is laid out again while it moves (animating a width would lay the
// screen out on every frame).
export function FillBar({ progress, color, track, height, style }: Props) {
  const radius = height / 2;
  const trackW = useSharedValue(0);
  const slide = useAnimatedStyle(() => ({
    // (Hidden until the track has been measured, so a full bar never flashes on the first frame.)
    opacity: trackW.value > 0 ? 1 : 0,
    transform: [{ translateX: (Math.min(1, Math.max(0, progress.value)) - 1) * trackW.value }],
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        trackW.value = e.nativeEvent.layout.width;
      }}
      style={[{ height, borderRadius: radius, backgroundColor: track, overflow: "hidden" }, style]}
    >
      <Animated.View style={[{ height: "100%", width: "100%", borderRadius: radius, backgroundColor: color }, slide]} />
    </View>
  );
}
