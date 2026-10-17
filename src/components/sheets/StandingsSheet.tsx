import { ScrollView, useWindowDimensions, View } from "react-native";
import { tileStatus } from "../../game/describe";
import { leaderOf } from "../../game/moments";
import { raceNote } from "../../game/raceNote";
import { finalStandings } from "../../game/results";
import { scoreHand } from "../../game/scoring";
import { Player } from "../../game/types";
import { useUi } from "../AppContext";
import { Icon } from "../ui/Icon";
import { Panel } from "../ui/Panel";
import { Sheet } from "../ui/Sheet";
import { T } from "../ui/T";
import { RaceRow } from "./RaceRow";

type Props = {
  players: Player[];
  target: number;        // the score that wins
  me: number;            // your seat, for the YOU tag
  onClose: () => void;
};

// The Standings sheet: how close everyone is to the target. A note at the top says how far the leader
// still is, then every player best first (banked points; players on the same total share a rank).
// The crown goes to whoever is winning right now once this round's hands are counted, the same crown the
// table shows, so it can sit on a line that is not first.
export function StandingsSheet({ players, target, me, onClose }: Props) {
  const { colors } = useUi();
  const { height } = useWindowDimensions();
  const note = raceNote(players, me, target);
  const leader = leaderOf(players);

  return (
    <Sheet title="STANDINGS" onClose={onClose}>
      <ScrollView style={{ maxHeight: Math.round(height * 0.74) }} showsVerticalScrollIndicator={false}>
        <Panel tone="raised" outline={colors.gold} radius={14} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
          <View accessible accessibilityLabel={`${note.headline}. ${note.rule}`} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {note.number > 0 ? (
              <T size={30} weight="display" lh={1} color={colors.gold}>{String(note.number)}</T>
            ) : (
              <Icon name="trophy" size={30} color={colors.gold} />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <T size={13} weight={900} lh={1.1}>{note.headline}</T>
              <T size={11.5} weight={700} lh={1.25} color={colors.textFaint}>{note.rule}</T>
            </View>
          </View>
        </Panel>

        <View style={{ gap: 6, marginTop: 12 }}>
          {finalStandings(players).map((s) => {
            const player = players[s.seat];
            return (
              <RaceRow
                key={s.seat}
                rank={s.rank}
                name={s.name}
                look={s.look}
                total={s.total}
                now={scoreHand(player)}
                status={tileStatus(player, false)}
                target={target}
                isMe={s.seat === me}
                isLeader={s.seat === leader}
              />
            );
          })}
        </View>

        <View style={{ marginTop: 12 }}>
          <T size={11} weight={700} lh={1.3} color={colors.textFaint}>
            Totals are banked points. “This round” is what each hand is worth right now.
          </T>
        </View>
      </ScrollView>
    </Sheet>
  );
}
