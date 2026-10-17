import Svg, { Path } from "react-native-svg";
import { useUi } from "../AppContext";

type Props = {
  width: number;     // the crown is a bit wider than it is tall; the height follows from this
  rotate?: number;   // degrees: a small tilt looks friendlier, like a crown worn at an angle
};

// The winner's crown: gold with a darker gold edge. (The small crown icon in Icon.tsx is a single
// flat colour, which looks too plain on the big winner screen.)
export function Crown({ width, rotate = 0 }: Props) {
  const { colors } = useUi();
  const height = Math.round((width * 20) / 26);
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 26 20"
      style={{ transform: [{ rotate: `${rotate}deg` }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M2 17 L1 5 L8 10 L13 2 L18 10 L25 5 L24 17 Z" fill={colors.gold} stroke={colors.goldDark} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}
