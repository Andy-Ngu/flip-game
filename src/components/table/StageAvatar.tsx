import { View } from "react-native";
import { Player } from "../../game/types";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { FILL } from "../fill";
import { Ring } from "../ui/Ring";
import { T } from "../ui/T";
import { OrderBadge } from "./PickMarks";
import type { ClockView } from "./useTurnClock";

export const STAGE_AVATAR = 46;

type Props = {
  player: Player;             // you
  target: number;
  clock: ClockView | null;    // on your turn the turn clock takes the avatar's place
  accent: string;             // the colour of the clock ring
  badge?: number | null;      // the order the round is played in (1 plays first), shown while the round starts
};

// Your face on the stage: a ring that fills towards the winning score. On your turn it turns into the
// turn clock (a ring that empties, with the seconds left in the middle).
export function StageAvatar({ player, target, clock, accent, badge }: Props) {
  const { colors } = useUi();
  return (
    <View style={{ width: STAGE_AVATAR, height: STAGE_AVATAR }}>
      {clock ? (
        <View accessible accessibilityRole="timer" accessibilityLabel={`${clock.secondsLeft} seconds left`} style={FILL}>
          <Ring size={STAGE_AVATAR} stroke={4} progress={clock.ring} color={accent} track={colors.border} duration={clock.ringMs} linear />
          <View
            style={{
              position: "absolute", left: 7, top: 7, width: 32, height: 32, borderRadius: 16, backgroundColor: accent,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <T fixed size={17} weight="display" lh={1} color={colors.onGold}>{clock.secondsLeft}</T>
          </View>
        </View>
      ) : (
        <Avatar look={player.look} size={STAGE_AVATAR} ring={{ progress: target > 0 ? player.totalScore / target : 0, color: colors.gold, track: colors.border }} />
      )}
      {/* The play order badge hangs on the top left corner of the avatar. */}
      {badge ? <OrderBadge n={badge} speak style={{ position: "absolute", left: -7, top: -7 }} /> : null}
    </View>
  );
}
