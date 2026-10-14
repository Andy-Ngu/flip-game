import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { describeCard } from "../game/describe";
import { scoreHand } from "../game/scoring";
import { Player } from "../game/types";
import { BUST_RED, CARD_COLORS, FREEZE_BLUE, styles } from "./PlayerCard.styles";

const STATUS_LABEL = {
  playing: "",
  stayed: "Stayed",
  busted: "BUST",
  frozen: "Frozen",
} as const;

type Props = {
  player: Player;
  acting: boolean;    // this player is the one who must act right now
  choosing: boolean;  // ...and they are picking a target, not hitting or staying
  dealer: boolean;
};

export function PlayerCard({ player: p, acting, choosing, dealer }: Props) {
  // Shared values live on the UI thread, so these animations stay smooth
  // even while the JavaScript side is busy.
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);
  const [flashColor, setFlashColor] = useState(BUST_RED);

  // Play an effect when this player's status changes.
  useEffect(() => {
    if (p.status === "busted") {
      setFlashColor(BUST_RED);
      shake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withRepeat(withTiming(10, { duration: 110 }), 5, true),
        withTiming(0, { duration: 60 })
      );
      flash.value = withSequence(withTiming(0.35, { duration: 120 }), withTiming(0, { duration: 700 }));
    } else if (p.status === "frozen") {
      setFlashColor(FREEZE_BLUE);
      flash.value = withSequence(withTiming(0.4, { duration: 150 }), withTiming(0, { duration: 900 }));
    }
  }, [p.status]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <Animated.View
      style={[styles.player, acting && styles.acting, p.status !== "playing" && styles.out, shakeStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { backgroundColor: flashColor }, flashStyle]}
      />

      <View style={styles.row}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{p.name}</Text>
          {acting && <Text style={styles.badge}>{choosing ? "CHOOSING" : "TURN"}</Text>}
        </View>
        <Text style={styles.score}>Total: {p.totalScore}</Text>
      </View>

      <Text style={styles.tag}>
        {p.bot ? `${p.bot} computer` : "Human"}
        {dealer ? "  ·  dealer" : ""}
      </Text>

      <View style={styles.hand}>
        {p.hand.length === 0 && <Text style={styles.empty}>No cards yet</Text>}
        {p.hand.map((card, k) => (
          // The key includes the card so a new card in the same spot animates in again.
          <Animated.View
            key={`${k}-${describeCard(card)}`}
            entering={FadeInDown.duration(280)}
            style={[styles.card, { backgroundColor: CARD_COLORS[card.kind] }]}
          >
            <Text style={styles.cardText}>{describeCard(card)}</Text>
          </Animated.View>
        ))}
      </View>

      <Text style={[styles.status, p.status === "busted" && styles.bust]}>
        This round: {scoreHand(p)} {STATUS_LABEL[p.status]}
      </Text>
    </Animated.View>
  );
}
