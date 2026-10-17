import { View } from "react-native";
import { useUi } from "../AppContext";
import { Icon, IconName } from "./Icon";
import { Tap } from "./Tap";

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;       // the drawn square: 44 unless given
  color?: string;
  badge?: boolean;
  hitSlop?: number;    // extra room around it that also counts as a tap (a 40 px button with 4 is a 48 px target)
};

// A square button with just an icon: back, menu, close. The drawn square is 44 by 44 unless told otherwise,
// and anything smaller asks for a hitSlop so that the tap is still 48 by 48 (what Android asks of a button).
export function IconButton({ icon, label, onPress, size = 44, color, badge, hitSlop }: Props) {
  const { colors } = useUi();
  return (
    <Tap label={label} onPress={onPress} hitSlop={hitSlop}>
      {(pressed) => (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            borderWidth: colors.borderWidth,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={Math.round(size * 0.5)} color={color ?? colors.text} />
          {badge ? (
            <View style={{ position: "absolute", top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.surface }} />
          ) : null}
        </View>
      )}
    </Tap>
  );
}
