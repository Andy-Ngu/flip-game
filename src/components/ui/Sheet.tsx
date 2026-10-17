import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUi } from "../AppContext";
import { FILL } from "../fill";
import { useBackButton } from "../useBackButton";
import { Dim } from "./Dim";
import { IconButton } from "./IconButton";
import { T } from "./T";

type Props = {
  title: string;
  onClose: () => void;     // the close button, a tap on the dark area, or Android's back button
  children?: ReactNode;
};

// A panel that slides up from the bottom of the screen over a dimmed table: the menu, standings,
// the chat phrases. It sits above the phone's navigation bar.
export function Sheet({ title, onClose, children }: Props) {
  const { colors, reduceMotion } = useUi();
  const insets = useSafeAreaInsets();
  useBackButton(true, () => {
    onClose();
    return true;
  });

  return (
    <Dim onPress={onClose} strength={0.55} label={`Close ${title}`}>
      <View pointerEvents="box-none" style={[FILL, { justifyContent: "flex-end" }]}>
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(120) : SlideInDown.duration(220)}
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: colors.borderWidth,
            borderBottomWidth: 0,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingTop: 10,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 10 }} />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flex: 1 }} accessibilityRole="header">
              <T size={22} weight="display" spacing={1.5} color={colors.gold} numberOfLines={1}>{title}</T>
            </View>
            <IconButton icon="close" label="Close" onPress={onClose} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Dim>
  );
}
