import { View } from "react-native";
import { TableMetrics } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { Button } from "../ui/Button";

type Props = {
  metrics: TableMetrics;
  canAct: boolean;         // it is your turn and nothing is waiting for a pick
  canStay: boolean;        // you hold at least one card
  stayPoints: number;      // what staying would bank
  onHit: () => void;
  onStay: () => void;
};

// The buttons at the bottom: HIT and STAY (greyed out until it is your turn). They can swap sides for
// left-handed players. (Quick chat, Emotes and Standings are icons in the top bar; see TopRow.)
export function Dock({ metrics, canAct, canStay, stayPoints, onHit, onStay }: Props) {
  const { swapSides } = useUi();
  const hit = (
    <Button key="hit" label="HIT" sub="Draw a card" variant="gold" size="lg" height={metrics.dockMain} flex={1.15} disabled={!canAct} onPress={onHit} haptic="light" />
  );
  const stay = (
    <Button key="stay" label="STAY" sub={`Bank ${stayPoints}`} variant="blue" size="lg" height={metrics.dockMain} flex={1} disabled={!canAct || !canStay} onPress={onStay} haptic="light" />
  );
  return <View style={{ flexDirection: "row", gap: 8 }}>{swapSides ? [stay, hit] : [hit, stay]}</View>;
}
