import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scoreHand } from "../game/scoring";
import { Card, Player } from "../game/types";
import { Hand } from "./Hand";
import { BUST_RED, TIMEOUT_BLUE, styles } from "./PlayerCard.styles";
import { ShieldBlock } from "./ShieldBlock";

const STATUS_LABEL = {
  playing: "",
  stayed: "Stayed",
  busted: "BUST",
  timedOut: "Timed out",
} as const;

type Props = {
  player: Player;
  acting: boolean;    // this player is the one who must act right now
  choosing: boolean;  // ...and they are picking a target, not hitting or staying
  dealer: boolean;
  shieldBlock?: { shield: Card; duplicate: Card | null; key: number } | null; // set while a Shield is blocking a duplicate
  onShieldBlockDone?: () => void;
};

export function PlayerCard({ player: p, acting, choosing, dealer, shieldBlock, onShieldBlockDone }: Props) {
  // Shared values live on the UI thread, so these animations stay smooth
  // even while the JavaScript side is busy.
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);
  const pop = useSharedValue(1);
  const [flashColor, setFlashColor] = useState(BUST_RED);
  const roundScore = scoreHand(p);

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
    } else if (p.status === "timedOut") {
      setFlashColor(TIMEOUT_BLUE);
      flash.value = withSequence(withTiming(0.4, { duration: 150 }), withTiming(0, { duration: 900 }));
    }
  }, [p.status]);

  // The round score swells and settles each time it changes, so points feel earned.
  useEffect(() => {
    pop.value = withSequence(withTiming(1.4, { duration: 90 }), withSpring(1, { damping: 7, stiffness: 180 }));
  }, [roundScore]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

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

      <Hand cards={p.hand} dead={p.status === "busted"} active={acting} />

      <View style={styles.statusRow}>
        <Text style={[styles.status, p.status === "busted" && styles.bust]}>This round: </Text>
        <Animated.Text style={[styles.roundScore, p.status === "busted" && styles.bust, popStyle]}>
          {roundScore}
        </Animated.Text>
        <Text style={[styles.status, p.status === "busted" && styles.bust]}>
          {" "}
          {STATUS_LABEL[p.status]}
        </Text>
      </View>

      {shieldBlock && (
        <ShieldBlock
          key={shieldBlock.key}
          shield={shieldBlock.shield}
          duplicate={shieldBlock.duplicate}
          onDone={onShieldBlockDone ?? (() => {})}
        />
      )}
    </Animated.View>
  );
}
