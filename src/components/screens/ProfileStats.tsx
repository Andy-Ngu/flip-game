import { View } from "react-native";
import { Stats, winRate } from "../../game/stats";
import { useUi } from "../AppContext";
import { Panel } from "../ui/Panel";
import { T } from "../ui/T";

type Props = { stats: Stats };

type Tile = { label: string; value: string; gold?: boolean };

// Your record on this phone: six tiles, two in a row. Wins and Seven Stacks are the gold ones.
// (Leaving a game early never counts, so these only grow when a game is played to the end.)
export function ProfileStats({ stats }: Props) {
  const { colors } = useUi();
  const tiles: Tile[] = [
    { label: "GAMES PLAYED", value: String(stats.games) },
    { label: "WINS", value: String(stats.wins), gold: true },
    { label: "WIN RATE", value: `${winRate(stats)}%` },
    { label: "BEST ROUND", value: String(stats.bestRound) },
    { label: "SEVEN STACKS", value: String(stats.sevenStacks), gold: true },
    { label: "TOP SCORE", value: String(stats.topScore) },
  ];
  const rows = [tiles.slice(0, 2), tiles.slice(2, 4), tiles.slice(4, 6)];

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 8 }}>
          {row.map((t) => (
            <Panel
              key={t.label}
              style={{ flex: 1, minHeight: 78, paddingVertical: 12, paddingHorizontal: 14, justifyContent: "space-between", gap: 6 }}
            >
              <View accessible accessibilityLabel={`${t.label.toLowerCase()}: ${t.value}`} style={{ flex: 1, justifyContent: "space-between", gap: 6 }}>
                <T size={11} weight={900} spacing={1.2} lh={1.1} color={colors.textFaint}>{t.label}</T>
                <T size={32} weight="display" lh={1} color={t.gold ? colors.gold : colors.text}>{t.value}</T>
              </View>
            </Panel>
          ))}
        </View>
      ))}
    </View>
  );
}
