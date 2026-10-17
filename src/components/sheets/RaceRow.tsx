import { memo } from "react";
import { View } from "react-native";
import { TileStatus } from "../../game/describe";
import { ordinal } from "../../game/results";
import { Look } from "../../game/types";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { Icon } from "../ui/Icon";
import { T } from "../ui/T";

type Props = {
  rank: number;         // 1 is the best; players on the same total share a rank
  name: string;
  look?: Look;
  total: number;        // banked points, from finished rounds
  now: number;          // what the cards in their hand are worth if the round ended right now
  status: TileStatus;
  target: number;       // the score that wins
  isMe: boolean;
  isLeader: boolean;    // wearing the crown: winning right now, counting this round's hand
};

// The word beside the name, and how it is read aloud. "turn" cannot happen here (the sheet does not know
// whose turn it is) but the status type has it, so it reads like waiting.
const SPOKEN: Record<TileStatus, string> = { turn: "still playing", waiting: "still playing", stayed: "stayed", bust: "busted", out: "timed out" };

// One line of the Standings sheet: rank, character, name (with a crown for the leader and YOU on your own
// line), a thin bar showing how far the total is on the way to the target, the total, and what this
// round's hand is worth right now.
export const RaceRow = memo(function RaceRow({ rank, name, look, total, now, status, target, isMe, isLeader }: Props) {
  const { colors } = useUi();
  const first = rank === 1;
  const share = target > 0 ? Math.min(1, Math.max(0, total / target)) : 0;

  const word = status === "bust" ? "BUST" : status === "out" ? "TIMED OUT" : status === "stayed" ? "STAYED" : "PLAYING";
  const wordColor = status === "bust" ? colors.danger : status === "out" ? colors.blue : status === "stayed" ? colors.textFaint : colors.gold;
  const nowColor = status === "bust" ? colors.danger : status === "stayed" ? colors.textFaint : colors.gold;

  const spoken =
    `${ordinal(rank)}. ${name}${isMe ? ", you" : ""}${isLeader ? ", winning right now" : ""}. ` +
    `${total} of ${target} points. ${pointsText(now)} this round, ${SPOKEN[status]}.`;

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: colors.borderWidth,
        borderColor: isMe ? colors.gold : colors.border,
        backgroundColor: isMe ? colors.surfaceRaised : colors.bg,
        paddingVertical: 5,
        paddingLeft: 10,
        paddingRight: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ width: 18, alignItems: "center" }}>
        <T size={18} weight="display" lh={1} color={first ? colors.gold : colors.textFaint}>{String(rank)}</T>
      </View>

      <Avatar look={look} size={34} />

      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        {/* Wraps onto a second line when the name, the tags and the status do not fit (long names, big text). */}
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 6, rowGap: 3 }}>
          <T size={14} weight={800} lh={1.1} numberOfLines={1} style={{ flexShrink: 1 }}>{name}</T>
          {isLeader ? <Icon name="crown" size={14} color={colors.gold} /> : null}
          {isMe ? (
            <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: colors.gold }}>
              <T size={9} weight={900} spacing={1} lh={1.2} color={colors.onGold}>YOU</T>
            </View>
          ) : null}
          <T size={10} weight={900} spacing={0.5} lh={1.1} color={wordColor}>{word}</T>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isMe ? colors.bg : colors.surface, overflow: "hidden" }}>
          <View style={{ width: `${share * 100}%`, height: "100%", borderRadius: 3, backgroundColor: first ? colors.gold : colors.textFaint }} />
        </View>
      </View>

      <View style={{ minWidth: 62, alignItems: "flex-end", gap: 3 }}>
        <T size={22} weight="display" lh={1}>{String(total)}</T>
        <T size={10.5} weight={900} lh={1.1} color={nowColor} numberOfLines={1}>{`+${now} this round`}</T>
      </View>
    </View>
  );
});
