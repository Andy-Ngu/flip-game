import { memo } from "react";
import { View } from "react-native";
import { DECK_SIZE } from "../../game/deck";
import { deckLow } from "../../game/moments";
import { TableMetrics } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { T } from "../ui/T";

type Props = { left: number; metrics: TableMetrics };

// The deck: how many cards are left to draw. Only a count, never the cards.
export const DeckTile = memo(function DeckTile({ left, metrics }: Props) {
  const { colors } = useUi();
  const low = deckLow(left);
  const small = metrics.density === "tight";
  const w = small ? 28 : 36;
  const h = small ? 41 : 54;
  const share = Math.max(0, Math.min(1, left / DECK_SIZE));

  return (
    <View
      accessible
      accessibilityLabel={`Draw pile: ${left} of ${DECK_SIZE} cards left`}
      style={{
        height: metrics.tileH,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: low ? colors.warn : colors.gold,
        backgroundColor: colors.bg,
        paddingHorizontal: 9,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
      }}
    >
      <View style={{ width: w + 6, height: h + 5 }}>
        <View style={{ position: "absolute", left: 5, top: 0, width: w, height: h, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border }} />
        <View
          style={{
            position: "absolute", left: 0, top: 4, width: w, height: h, borderRadius: 6, backgroundColor: colors.bg,
            borderWidth: 2, borderColor: colors.gold, alignItems: "center", justifyContent: "center",
          }}
        >
          <T fixed size={small ? 17 : 22} weight="display" lh={1} color={colors.gold}>7</T>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <T size={small ? 24 : 28} weight="display" lh={1} color={low ? colors.warn : colors.text}>{left}</T>
          <T size={11} weight={800} lh={1} color={colors.textFaint}>{`of ${DECK_SIZE}`}</T>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" }}>
          <View style={{ width: `${share * 100}%`, height: "100%", backgroundColor: low ? colors.warn : colors.gold }} />
        </View>
        <T size={10.5} weight={900} spacing={1} lh={1} color={colors.textFaint}>DRAW PILE</T>
      </View>
    </View>
  );
});
