import { useEffect, useMemo, useRef } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MIN_CROWN_POINTS } from "../../game/moments";
import { NEXT_ROUND_MS } from "../../game/momentTimes";
import { paced } from "../../game/pace";
import { roundResults } from "../../game/results";
import { Game } from "../../game/session";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { Button } from "../ui/Button";
import { FillBar } from "../ui/FillBar";
import { useAnnounce } from "../useAnnounce";
import { useScreenReader } from "../useScreenReader";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { Screen } from "../ui/Screen";
import { T } from "../ui/T";
import { ResultRow } from "./ResultRow";

type Props = {
  game: Game;              // a round that has just ended (phase "roundOver"); its points are not banked yet
  me: number;              // your seat
  onNext: () => void;      // "Next round", or the way on to the winner when this was the last round
  onMenu: () => void;      // the menu button in the corner
  paused?: boolean;        // a menu or dialog is open on top (or the app is in the background): the countdown to the next round waits
};

// The height of the bar that runs down while the next round is about to start by itself. A thin line is enough
// to show the time running out (it was 6 px; that was heavier than it needed to be).
const COUNTDOWN_H = 3;

// The board shown when a round ends: everyone best total first, what happened to each of them,
// the points they earned and their new total. NEXT ROUND starts the next round; if it is not pressed the next
// round starts by itself after 10 seconds, and a bar above the button shows the time running down. The
// wait starts over when a menu is closed, and it is not used with a screen reader on (there is no telling
// how long the board takes to listen to) or for "SEE THE WINNER", which is always the player's to press.
export function RoundResultsView({ game, me, onNext, onMenu, paused = false }: Props) {
  const { colors, scale, speed, reduceMotion } = useUi();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const target = game.target;
  const results = useMemo(() => roundResults(game.round.players, target), [game.round.players, target]);
  const { rows, gameEnds, tiedAtTop } = results;

  // Every line is drawn full size if they all fit on the screen. If not (7 or 8 players, a small phone, big
  // text) they are drawn a little smaller, and the list scrolls if it still does not fit.
  // 90 is the buttons under the list (more with the tie note), 68 the title above it, 20 and 16 the spacing.
  const room = height - insets.top - insets.bottom - 20 - 68 - (tiedAtTop ? 156 : 90) - 16;
  const dense = rows.length * Math.round(102 * (1 + (scale - 1) * 0.6)) > room;

  // Only say which players are computers when other people are at the table too (online). Playing
  // against the computer, every opponent would carry the label and it would just be noise.
  const showBot = rows.some((r) => r.seat !== me && !r.bot);
  // A crown for one clear leader: not for a tie, and not for a leader who has hardly any points.
  const leader = rows[0];
  const clearLeader = leader !== undefined && leader.total >= MIN_CROWN_POINTS && (rows.length < 2 || rows[1].rank !== 1);

  const subline = `First to ${target} wins`;

  // ---------- the next round, by itself ----------
  const screenReader = useScreenReader();
  const counting = !gameEnds && !screenReader && !paused;
  const left = useSharedValue(1);          // how much of the wait is left, 1 (all of it) to 0
  const latest = useRef(onNext);
  latest.current = onNext;
  const moved = useRef(false);
  useEffect(() => {
    left.value = 1;
    if (!counting) return;
    const total = paced(NEXT_ROUND_MS, speed);
    const timer = setTimeout(() => {
      if (moved.current) return;
      moved.current = true;
      latest.current();
    }, total);
    // The bar runs down smoothly; with Reduce motion on it goes down in steps of a second.
    let ticker: ReturnType<typeof setInterval> | null = null;
    if (reduceMotion) {
      const started = Date.now();
      ticker = setInterval(() => {
        left.value = Math.max(0, 1 - Math.floor((Date.now() - started) / 1000) * 1000 / total);
      }, 1000);
    } else {
      left.value = withTiming(0, { duration: total, easing: Easing.linear });
    }
    return () => {
      clearTimeout(timer);
      if (ticker) clearInterval(ticker);
    };
  }, [counting, speed, reduceMotion]);
  const pressNext = () => {
    if (moved.current) return;
    moved.current = true;
    onNext();
  };

  // What a screen reader says when the board appears.
  const who = (r: { seat: number; name: string }, you: string, other: string) => (r.seat === me ? you : `${r.name}${other}`);
  const spoken = !leader
    ? `Round ${game.roundNo} is over.`
    : tiedAtTop
      ? `Round ${game.roundNo} is over. There is a tie at the top, so there will be another round.`
      : gameEnds
        ? `Round ${game.roundNo} is over. ${who(leader, "You", "")} reached ${target}.`
        : `Round ${game.roundNo} is over. ${who(leader, "You are", " is")} in front with ${pointsText(leader.total)}.`;
  useAnnounce(spoken);

  return (
    <Screen padding={12}>
      <View style={{ paddingHorizontal: 4, marginBottom: 8, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }} accessibilityRole="header">
          <T size={30} weight="display" spacing={1.5} lh={1} color={colors.gold}>{`ROUND ${game.roundNo}`}</T>
          <T size={12.5} weight={700} lh={1.35} color={colors.textDim}>{subline}</T>
        </View>
        <IconButton icon="menu" label="Menu" size={48} onPress={onMenu} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingTop: 8, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
        {rows.map((row, i) => (
          <ResultRow
            key={row.id}
            row={row}
            index={i}
            target={target}
            isMe={row.seat === me}
            crown={clearLeader && i === 0}
            showBot={showBot}
            dense={dense}
          />
        ))}
      </ScrollView>

      <View style={{ gap: 10, paddingHorizontal: 4, paddingTop: 8 }}>
        {tiedAtTop ? (
          <Panel tone="raised" outline={colors.gold} radius={14} style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="info" size={22} color={colors.gold} />
            <View style={{ flex: 1, gap: 3 }} accessible accessibilityLabel="Tie at the top. A tie at the top plays another round.">
              <T size={13} weight={900} spacing={0.8} lh={1.1}>TIE AT THE TOP</T>
              <T size={12} weight={700} lh={1.3} color={colors.textDim}>A tie at the top plays another round.</T>
            </View>
          </Panel>
        ) : null}
        <Button label={gameEnds ? "SEE THE WINNER" : "NEXT ROUND"} size="md" height={60} onPress={pressNext} />
        {counting ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ marginTop: -4, paddingHorizontal: 6 }}>
            <FillBar progress={left} color={colors.gold} track={colors.surface} height={COUNTDOWN_H} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
