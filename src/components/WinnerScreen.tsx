import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { finalStandings } from "../game/results";
import { Player } from "../game/types";
import { Button } from "./Button";
import { Confetti } from "./Confetti";
import { styles } from "./WinnerScreen.styles";

type Props = {
  players: Player[];   // final totals
  winners: Player[];
  onPlayAgain: () => void;
  onQuit: () => void;
};

export function WinnerScreen({ players, winners, onPlayAgain, onQuit }: Props) {
  const standings = finalStandings(players);
  const winnerIds = new Set(winners.map((w) => w.id));
  const best = winners.length > 0 ? winners[0].totalScore : 0;

  // The name floats gently once it has landed.
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withDelay(
      1000,
      withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value * 6 - 3 }] }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <View pointerEvents="none" style={styles.glowOuter} />
      <View pointerEvents="none" style={styles.glowInner} />
      <Confetti />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Animated.Text
          allowFontScaling={false}
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.kicker}
        >
          {winners.length > 1 ? "WINNERS" : "WINNER"}
        </Animated.Text>

        <Animated.View entering={ZoomIn.delay(450).springify().damping(9)} style={floatStyle}>
          <Text allowFontScaling={false} style={styles.name}>
            {winners.map((w) => w.name).join(" & ")}
          </Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(800).duration(400)} style={styles.points}>
          with <Text style={styles.pointsValue}>{best}</Text> points
        </Animated.Text>

        <View style={styles.board}>
          {standings.map((s, i) => {
            const won = winnerIds.has(s.id);
            return (
              <Animated.View
                key={s.id}
                entering={FadeInDown.delay(1000 + i * 90).duration(350)}
                style={[styles.row, won && styles.rowWinner]}
              >
                <Text allowFontScaling={false} style={[styles.rank, won && styles.rankWinner]}>{s.rank}</Text>
                <Text style={styles.rowName} numberOfLines={1}>{s.name}</Text>
                <Text allowFontScaling={false} style={[styles.rowTotal, won && styles.rowTotalWinner]}>
                  {s.total}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <Button fill variant="secondary" label="Change players" onPress={onQuit} />
        <Button fill label="Play again" onPress={onPlayAgain} />
      </View>
    </Animated.View>
  );
}
