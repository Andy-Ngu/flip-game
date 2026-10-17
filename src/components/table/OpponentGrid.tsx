import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { TableMetrics } from "../../game/tableMetrics";

const SCROLL_TOP = 8;
const SCROLL_SIDE = 5;

type Props = {
  cells: ReactNode[];      // the other players' tiles, then the deck tile
  metrics: TableMetrics;
};

// The other players as a grid of two columns. Each cell is as wide as the metrics say, and the rows
// are as tall as a tile. If even the smallest layout does not fit (eight players, the biggest text,
// a small phone) the grid scrolls inside the room it has been given.
export function OpponentGrid({ cells, metrics }: Props) {
  const rows: ReactNode[][] = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));

  const grid = (
    <View style={{ gap: metrics.tileGap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", gap: metrics.tileGap }}>
          {row.map((cell, c) => (
            <View key={c} style={{ width: metrics.tileW }}>
              {cell}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  if (!metrics.scrollTiles) return <View style={{ height: metrics.tilesH }}>{grid}</View>;
  return (
    // The "PICK" tags hang a little above a tile and the order badges a little left of it, so the list is
    // given room for them (and pulled back by the same amount, so the tiles stay where they are).
    <ScrollView
      style={{ height: metrics.tilesH + SCROLL_TOP, marginTop: -SCROLL_TOP, marginHorizontal: -SCROLL_SIDE, flexGrow: 0 }}
      contentContainerStyle={{ paddingTop: SCROLL_TOP, paddingHorizontal: SCROLL_SIDE }}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Other players"
    >
      {grid}
    </ScrollView>
  );
}
