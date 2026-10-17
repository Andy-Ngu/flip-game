import { useEffect } from "react";
import { View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { COOLDOWN_MS } from "../../game/chat";
import { useUi } from "../AppContext";
import { FillBar } from "../ui/FillBar";

type Props = {
  left: number;   // milliseconds until the player may send again (the sheet keeps this up to date)
};

// The bar shown below the buttons while the pause between two messages is running: it drains from full to empty, so
// you can see when the buttons come back. There is no writing on it (the sheets keep the space under their buttons
// free of text); a screen reader is told "Wait 3 seconds before sending another message". Show it only while `left` is
// above 0, and give it a new `key` each time a message is sent so the bar starts again from full.
export function CooldownNote({ left }: Props) {
  const { colors, reduceMotion } = useUi();
  const seconds = Math.ceil(left / 1000);
  const share = useSharedValue(Math.min(1, left / COOLDOWN_MS));

  // When the note appears, glide the bar down to empty over the time that is left.
  useEffect(() => {
    if (reduceMotion) return;
    share.value = withTiming(0, { duration: left, easing: Easing.linear });
  }, [reduceMotion]);

  // With Reduce motion on there is no gliding: the bar simply follows the number.
  useEffect(() => {
    if (reduceMotion) share.value = Math.min(1, left / COOLDOWN_MS);
  }, [reduceMotion, left]);

  return (
    <View
      accessible
      accessibilityLabel={`Wait ${seconds} ${seconds === 1 ? "second" : "seconds"} before sending another message`}
      style={{ marginTop: 14, paddingHorizontal: 4 }}
    >
      <FillBar progress={share} color={colors.gold} track={colors.border} height={6} />
    </View>
  );
}
