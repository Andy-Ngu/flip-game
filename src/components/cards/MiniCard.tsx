import { View } from "react-native";
import { faceFor } from "../../game/cardFace";
import { Card } from "../../game/types";
import { useUi } from "../AppContext";
import { T } from "../ui/T";
import { ClockGlyph, ShieldGlyph } from "./Glyphs";

type Props = {
  card?: Card;           // leave out for an empty slot (a dashed outline)
  width?: number;        // 20 is the normal size; the height is always one and a half times the width
  duplicate?: boolean;   // the card that busted this player: drawn in red
};

// A tiny card for the opponent tiles. It shows just the number (or a small symbol), in the same
// colour as the full card, so you can read a rival's hand at a glance.
export function MiniCard({ card, width = 20, duplicate = false }: Props) {
  const { colors, highContrast } = useUi();
  const k = width / 20;
  const height = Math.round(width * 1.5);

  if (!card) {
    return (
      <View
        style={{ width, height, borderRadius: 4 * k, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.dim }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  const f = faceFor(card, highContrast);
  const ink = duplicate ? colors.danger : f.ink;
  const paper = duplicate ? colors.dangerBg : f.bg;
  const border = duplicate ? colors.danger : f.outline;
  const size = (f.center.length >= 3 ? 10 : f.center.length === 2 ? 13 : 14) * k;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 4 * k,
        borderWidth: f.thick ? 3 : 1.5,
        borderColor: border,
        backgroundColor: paper,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {f.icon === "shield" ? <ShieldGlyph width={9 * k} color={ink} tick={false} /> : null}
      {f.icon === "clock" ? <ClockGlyph size={11 * k} color={ink} /> : null}
      {f.icon === "three" || f.icon === null ? (
        <T fixed size={size} weight="display" color={ink} numberOfLines={1} lh={1} underline={f.underline}>{f.center}</T>
      ) : null}
    </View>
  );
}
