import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useUi } from "../AppContext";
import { T } from "../ui/T";
import { cardHeight } from "./CardFace";

const GOLD = "#F2C14E";
const NAVY = "#1B2440";

// Crossed diagonal lines over the whole card, drawn as one path.
function hatch(w: number, h: number, step: number): string {
  let d = "";
  for (let t = -h; t < w; t += step) d += `M${t} 0 L${t + h} ${h} `;
  for (let t = 0; t < w + h; t += step) d += `M${t} 0 L${t - h} ${h} `;
  return d;
}

// The back of a card: navy with gold crossed lines, a gold frame and the little stack of cards.
export function CardBack({ width }: { width: number }) {
  const { highContrast } = useUi();
  const k = width / 120;
  const height = cardHeight(width);
  const lines = useMemo(() => hatch(width, height, 12 * k), [width, height, k]);
  const miniCard = (left: number, top: number, rotate: number, border: string, bg: string, text: boolean) => (
    <View
      key={left}
      style={{
        position: "absolute",
        left: left * k,
        top: top * k,
        width: 48 * k,
        height: 72 * k,
        borderRadius: 8 * k,
        borderWidth: Math.max(1, 2.5 * k),
        borderColor: border,
        backgroundColor: bg,
        transform: [{ rotate: `${rotate}deg` }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {text ? <T fixed size={40 * k} weight="display" color={GOLD} lh={1}>7</T> : null}
    </View>
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: 14 * k, borderWidth: Math.max(1.5, 3 * k), borderColor: GOLD, backgroundColor: NAVY, overflow: "hidden" }}
    >
      <Svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {highContrast ? null : <Path d={lines} stroke={GOLD} strokeOpacity={0.14} strokeWidth={Math.max(1, 2 * k)} />}
        <Rect x={8 * k} y={8 * k} width={width - 16 * k} height={height - 16 * k} rx={8 * k} stroke={GOLD} strokeWidth={Math.max(1, 2 * k)} fill="none" />
      </Svg>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 62 * k, height: 88 * k }}>
          {miniCard(12, 0, 8, "#5B6BA0", "#243056", false)}
          {miniCard(6, 6, -2, "#9AA6D0", "#243056", false)}
          {miniCard(0, 12, -10, GOLD, NAVY, true)}
        </View>
      </View>
      {width >= 100 ? (
        <T fixed size={11 * k} weight="display" spacing={2} color={GOLD} align="center" style={{ position: "absolute", left: 0, right: 0, bottom: 14 * k }}>STACK SEVEN</T>
      ) : null}
    </View>
  );
}
