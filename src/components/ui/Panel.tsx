import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useUi } from "../AppContext";

type Props = {
  tone?: "surface" | "raised" | "deep";  // how light the panel is: deep sits behind, raised sits on top
  outline?: string;                      // the border colour; the palette's border when left out
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// A rounded box with a border: the building block of every card, tile and list on the screens.
export function Panel({ tone = "surface", outline, radius = 16, style, children }: Props) {
  const { colors } = useUi();
  const background = tone === "deep" ? colors.bg : tone === "raised" ? colors.surfaceRaised : colors.surface;
  return (
    <View style={[{ backgroundColor: background, borderColor: outline ?? colors.border, borderWidth: colors.borderWidth, borderRadius: radius }, style]}>
      {children}
    </View>
  );
}
