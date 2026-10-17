import { memo } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { COLORS } from "../../game/profile";
import { ordinal, Standing } from "../../game/results";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { T } from "../ui/T";

// The warm brown-gold of a bronze medal. It is one of the character colours, so it already sits well on the navy.
const BRONZE = COLORS[5];

type Props = {
  standing: Standing;
  isMe: boolean;
  compact: boolean;   // 7 or 8 players, or a short screen: a little smaller
  delay: number;      // how long to wait before sliding in (ms, already paced)
};

// One line of the final standings on the winner screen: place, character, name and final score.
// First place is gold, second silver-ish, third bronze, the rest quiet.
export const StandingRow = memo(function StandingRow({ standing, isMe, compact, delay }: Props) {
  const { colors, reduceMotion, speed } = useUi();
  const first = standing.rank === 1;
  const second = standing.rank === 2;
  const border = first ? colors.gold : second ? colors.textFaint : colors.border;
  const rankColor = first ? colors.gold : second ? colors.textDim : standing.rank === 3 ? BRONZE : colors.textFaint;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(paced(260, speed))}
      accessible
      accessibilityLabel={`${ordinal(standing.rank)}. ${standing.name}${isMe ? ", you" : ""}. ${pointsText(standing.total)}.`}
      style={{
        minHeight: compact ? 44 : 50,
        borderRadius: 14,
        borderWidth: colors.borderWidth,
        borderColor: border,
        backgroundColor: first ? colors.surfaceRaised : colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ width: 26, alignItems: "center" }}>
        <T size={20} weight="display" lh={1} color={rankColor}>{String(standing.rank)}</T>
      </View>
      <Avatar look={standing.look} size={compact ? 30 : 34} />
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "baseline", gap: 5 }}>
        <T size={15} weight={800} lh={1.1} numberOfLines={1} style={{ flexShrink: 1 }}>{standing.name}</T>
        {isMe ? <T size={13} weight={800} lh={1.1} color={colors.gold}>(you)</T> : null}
      </View>
      <T size={22} weight="display" lh={1}>{String(standing.total)}</T>
    </Animated.View>
  );
});
