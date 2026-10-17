import { View } from "react-native";
import { StageInfo } from "../../game/stageInfo";
import { STRIP_PAD } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { hexAlpha } from "../overlays/glow";
import { T } from "../ui/T";

type Props = {
  info: StageInfo;
  color: string;        // the colour of the title (and of the strip behind it)
};

// What is going on with you, in words, on a strip under the avatar and the score boxes:
// "YOUR TURN", "YOU STAYED  Banked 12", "BUSTED  Scores 0" ... The strip is as wide as the stage and tinted in the
// colour of the title, so even when there are only two words on it (YOUR TURN) it does not look like empty space,
// and the title is never split over two lines ("YOU S" / "TAYED"): the few words after it give way first.
// A screen reader is given the whole line (the time left on your turn is on the avatar, not repeated here).
export function StageStatus({ info, color }: Props) {
  const { colors, highContrast, scale } = useUi();
  const spoken = info.sub ? `${info.title}. ${info.sub}` : info.title;
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{
        // Centred both ways: the pair sits in the middle of the strip, and the small words are level with the middle
        // of the title (lined up on the bottom edge they sat a few pixels low, which read as off-centre).
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        paddingHorizontal: 10, paddingVertical: STRIP_PAD(scale), borderRadius: 10,
        backgroundColor: hexAlpha(color, highContrast ? 0.22 : 0.15),
      }}
    >
      <T size={19} weight="display" spacing={1.2} lh={1.05} color={color} numberOfLines={1} style={{ flexShrink: 0 }}>{info.title}</T>
      {info.short ? (
        <T size={12} weight={700} lh={1.1} color={colors.textDim} numberOfLines={1} style={{ flexShrink: 1 }}>{info.short}</T>
      ) : null}
    </View>
  );
}
