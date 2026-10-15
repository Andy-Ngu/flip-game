import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { roundResults, Row } from "../game/results";
import { Player } from "../game/types";
import { Button } from "./Button";
import { CountUp } from "./CountUp";
import { styles } from "./RoundSummary.styles";

type Props = {
  players: Player[];     // the players as the round ended (points not yet banked)
  round: number;         // 1 for the first round
  onContinue: () => void;
  onPeek: () => void;    // hide this board to look at the table
};

const STATUS_TEXT = {
  playing: "Banked",
  stayed: "Stayed",
  busted: "Bust",
  timedOut: "Timed out",
} as const;

// How long each row waits before it appears, and how long the totals wait before counting.
const ROW_STAGGER = 100;
const COUNT_DELAY = 500;

export function RoundSummary({ players, round, onContinue, onPeek }: Props) {
  const { rows, gameEnds, tiedAtTop } = roundResults(players);

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.overlay}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text allowFontScaling={false} style={styles.kicker}>ROUND {round}</Text>
        <Text style={styles.headline}>
          {gameEnds ? "That's the game!" : tiedAtTop ? "Tied at the top!" : "Round complete"}
        </Text>
        {tiedAtTop && (
          <Text style={styles.message}>The leaders are level on 200 or more, so one more round decides it.</Text>
        )}
        {!gameEnds && !tiedAtTop && <Text style={styles.message}>First to 200 wins.</Text>}

        <View style={styles.board}>
          {rows.map((row, i) => (
            <ResultRow key={row.id} row={row} index={i} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <Button fill variant="secondary" label="See table" onPress={onPeek} />
        <Button fill label={gameEnds ? "See the winner" : "Next round"} onPress={onContinue} />
      </View>
    </Animated.View>
  );
}

function ResultRow({ row, index }: { row: Row; index: number }) {
  const leader = row.rank === 1;
  const busted = row.status === "busted";
  const detail = row.sevenStack ? "Seven Stack! +15 included" : STATUS_TEXT[row.status];

  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * ROW_STAGGER).duration(350).springify()}
      style={[styles.row, leader && styles.rowLeader]}
    >
      <View style={[styles.rank, leader && styles.rankLeader]}>
        <Text allowFontScaling={false} style={[styles.rankText, leader && styles.rankTextLeader]}>
          {row.rank}
        </Text>
      </View>

      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
        <Text style={[styles.detail, busted && styles.detailBust, row.sevenStack && styles.detailSeven]}>
          {detail}
        </Text>
      </View>

      <View style={styles.numbers}>
        <Text allowFontScaling={false} style={[styles.gain, busted && styles.gainBust]}>
          {busted ? "BUST" : `+${row.roundPoints}`}
        </Text>
        <CountUp
          from={row.before}
          to={row.total}
          delay={COUNT_DELAY + index * ROW_STAGGER}
          style={[styles.total, leader && styles.totalLeader]}
        />
      </View>
    </Animated.View>
  );
}
