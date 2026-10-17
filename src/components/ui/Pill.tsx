import { View } from "react-native";
import { useUi } from "../AppContext";
import { T } from "./T";

type Props = { text: string; color?: string; size?: number };

// A small rounded label such as ROUND 3.
export function Pill({ text, color, size = 15 }: Props) {
  const { colors } = useUi();
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: colors.borderWidth,
        alignSelf: "flex-start",
      }}
    >
      <T size={size} weight="display" spacing={1.5} color={color ?? colors.gold}>{text}</T>
    </View>
  );
}
