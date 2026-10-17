import { ReactNode } from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUi } from "../AppContext";
import { Backdrop } from "./Backdrop";

type Props = {
  children?: ReactNode;
  scroll?: boolean;                // the content can be taller than the screen
  padding?: number;                // space at the left and right
  style?: StyleProp<ViewStyle>;
};

// The frame of a screen: the backdrop, and room for the status bar and the phone's navigation bar.
export function Screen({ children, scroll, padding = 16, style }: Props) {
  const { colors } = useUi();
  const insets = useSafeAreaInsets();
  const frame = {
    paddingTop: insets.top + 8,
    paddingBottom: insets.bottom + 12,
    paddingLeft: insets.left + padding,
    paddingRight: insets.right + padding,
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop />
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[frame, { flexGrow: 1 }, style]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, frame, style]}>{children}</View>
      )}
    </View>
  );
}
