import { ReactNode } from "react";
import { View } from "react-native";
import { useUi } from "../AppContext";
import { IconButton } from "./IconButton";
import { T } from "./T";

type Props = {
  title: string;
  onBack?: () => void;     // leave out for a screen with no way back (the first-time character screen)
  backLabel?: string;      // what a screen reader says for the back arrow
  right?: ReactNode;       // anything the screen wants on the right
  inset?: number;          // space at the left and right, for a screen whose content reaches the edges
  titleSize?: number;      // a screen with its own big heading underneath (How to play) uses a smaller title
};

// The top of a screen: a back button, the title in gold, and anything the screen wants on the right.
export function TopBar({ title, onBack, backLabel = "Back", right, inset = 0, titleSize = 26 }: Props) {
  const { colors } = useUi();
  return (
    <View style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4, paddingHorizontal: inset }}>
      {onBack ? <IconButton icon="chevronLeft" label={backLabel} size={48} onPress={onBack} /> : null}
      <View style={{ flex: 1, minWidth: 0 }} accessibilityRole="header">
        {/* With the biggest text the title shrinks a little rather than being cut off. */}
        <T size={titleSize} weight="display" spacing={1.5} color={colors.gold} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{title}</T>
      </View>
      {right}
    </View>
  );
}
