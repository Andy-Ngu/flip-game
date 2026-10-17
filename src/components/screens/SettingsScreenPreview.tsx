import { View } from "react-native";
import { useUi } from "../AppContext";
import { MiniCard } from "../cards/MiniCard";
import { T } from "../ui/T";

// A tiny sample of an opponent's tile, drawn under the Text size choices. It uses the same text
// component as the table, so it grows the moment a bigger size is picked.
export function SettingsScreenPreview() {
  const { colors } = useUi();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.bg }}
    >
      <MiniCard card={{ kind: "number", value: 8 }} width={20} />
      <View style={{ flexShrink: 1, gap: 3 }}>
        <T size={13} weight={800} lh={1.1}>Fizz · THEIR TURN</T>
        <T size={11.5} weight={900} lh={1.1} color={colors.gold}>+19 this round</T>
      </View>
    </View>
  );
}
