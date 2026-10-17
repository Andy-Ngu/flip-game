import { View } from "react-native";
import { TOP_BAR } from "../../game/tableMetrics";
import { useUi } from "../AppContext";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Pill } from "../ui/Pill";
import { T } from "../ui/T";

type Props = {
  round: number;
  target: number;
  online?: boolean;      // shows the connection bars (only when playing with other people)
  onMenu: () => void;
  onChat: () => void;
  onEmotes: () => void;
  onStandings: () => void;
};

// The small buttons are drawn 40 wide and count 4 more on every side as a tap: 48 by 48, what Android
// asks of anything you press. The menu button is the one that matters most, so it is the full 44.
const SMALL = 40;
const SLOP = 4;

// The top of the table: which round it is and what the game is played to, then the icons for Quick chat,
// Emotes and Standings, and the menu button. With "Hide chat and emotes" on, the two chat icons are left out.
// The "to 150" is only written when there is room for it (the icons come first, and the bigger text sizes
// make the round label wider); the winning score is also on the round board and in Standings.
export function TopRow({ round, target, online, onMenu, onChat, onEmotes, onStandings }: Props) {
  const { colors, hideChat, scale } = useUi();
  const showTarget = scale <= 1 && !(online ?? false);
  return (
    <View style={{ height: TOP_BAR, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
        <Pill text={`ROUND ${round}`} />
        {showTarget ? <T size={12} weight={800} color={colors.textFaint} numberOfLines={1}>{`to ${target}`}</T> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {online ? <Icon name="signal" size={18} color={colors.good} /> : null}
        {hideChat ? null : <IconButton icon="chat" label="Quick chat" size={SMALL} hitSlop={SLOP} onPress={onChat} />}
        {hideChat ? null : <IconButton icon="smile" label="Emotes" size={SMALL} hitSlop={SLOP} onPress={onEmotes} />}
        <IconButton icon="podium" label="Standings" size={SMALL} hitSlop={SLOP} onPress={onStandings} />
        <IconButton icon="menu" label="Menu" onPress={onMenu} />
      </View>
    </View>
  );
}
