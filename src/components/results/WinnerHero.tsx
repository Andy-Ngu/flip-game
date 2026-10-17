import { View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { Standing } from "../../game/results";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { hexAlpha } from "../overlays/glow";
import { T } from "../ui/T";
import { Crown } from "./Crown";

type Props = {
  winner: Standing;
  isMe: boolean;        // you are the winner
  rounds: number;       // how many rounds the game took
  celebrate: boolean;   // add the gold glow around the portrait (only when you won)
  small: boolean;       // a short screen: a smaller portrait and title
};

// The top of the winner screen: a crown, the winner's portrait, "<NAME> WINS!" and the final score.
export function WinnerHero({ winner, isMe, rounds, celebrate, small }: Props) {
  const { colors, reduceMotion, reduceFlashes, speed } = useUi();
  const animate = !reduceMotion;
  const size = small ? 104 : 132;
  const title = isMe ? "YOU WIN!" : `${winner.name.toUpperCase()} WINS!`;
  const glow = celebrate && !reduceFlashes ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 30, color: hexAlpha(colors.gold, 0.5) }] } : null;

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Animated.View
        entering={animate ? ZoomIn.springify().damping(12) : undefined}
        style={{ width: size, height: size, marginTop: 34 }}
      >
        <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 5, borderColor: colors.gold, alignItems: "center", justifyContent: "center" }, glow]}>
          <Avatar look={winner.look} size={size - 10} />
        </View>
        {/* The crown sits on top of the portrait, half over its edge. */}
        <Animated.View
          entering={animate ? FadeInDown.delay(paced(300, speed)).duration(paced(300, speed)) : undefined}
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, top: -34, alignItems: "center" }}
        >
          <Crown width={64} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={animate ? FadeInDown.delay(paced(350, speed)).duration(paced(320, speed)) : undefined}
        accessibilityRole="header"
        style={{ alignSelf: "stretch", marginTop: 14 }}
      >
        <T
          size={small ? 34 : 42}
          weight="display"
          spacing={2}
          lh={1.05}
          align="center"
          color={colors.gold}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={{ textShadowColor: colors.goldDark, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 }}
        >
          {title}
        </T>
      </Animated.View>
      <Animated.View entering={animate ? FadeInDown.delay(paced(420, speed)).duration(paced(320, speed)) : undefined}>
        <T size={15} weight={800} color={colors.textDim} align="center">{`${winner.total} points · ${rounds} ${rounds === 1 ? "round" : "rounds"}`}</T>
      </Animated.View>
    </View>
  );
}
