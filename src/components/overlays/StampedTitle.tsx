import { View } from "react-native";
import { useUi } from "../AppContext";
import { T } from "../ui/T";

type Props = {
  children: string;
  size: number;        // the size of the letters, as drawn in the mockup (it ignores the Text size setting: it is artwork)
  depth?: number;      // how thick the darker edge underneath is, in px
  spacing?: number;    // space between letters
};

// Big gold lettering with a thick darker edge underneath, like a raised sign (ROUND 3, SEVEN STACK!).
// React Native can draw only one shadow behind a piece of text, so the edge is a second copy of the same
// words in the darker gold, a few pixels lower, with the soft shadow on that copy.
export function StampedTitle({ children, size, depth = 4, spacing = 2 }: Props) {
  const { colors } = useUi();
  return (
    <View style={{ alignSelf: "stretch", paddingBottom: depth }}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", left: 0, right: 0, top: depth }}
      >
        <T
          fixed
          size={size}
          weight="display"
          spacing={spacing}
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          color={colors.goldDark}
          style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: depth + 4 }, textShadowRadius: 14 }}
        >
          {children}
        </T>
      </View>
      <T fixed size={size} weight="display" spacing={spacing} align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} color={colors.gold}>
        {children}
      </T>
    </View>
  );
}
