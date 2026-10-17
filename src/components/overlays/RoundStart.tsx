import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paced } from "../../game/pace";
import { ordinal, StartRow } from "../../game/results";
import { pointsText } from "../../game/words";
import { useStyles, useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { Backdrop } from "../ui/Backdrop";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { useScreenReader } from "../useScreenReader";
import { makeStyles, scoreColumn } from "./RoundStart.styles";
import { StampedTitle } from "./StampedTitle";

// The timing of the board, in milliseconds at Normal speed (the Game speed setting stretches or shrinks all of it).
const FIRST_ROW_MS = 100;    // the first row starts sliding in
const ROW_STAGGER_MS = 120;  // each next row starts this much later
const ROW_MS = 400;          // how long one row takes to slide in
const FADE_MS = 200;         // with Reduce motion every row just fades in, all together
const HOLD_MS = 2400;        // how long the finished board stays, so there is time to find your place

const MAX_ROW = 48;
const MIN_ROW = 38;
const ROW_GAP = 5;

type Props = {
  rows: StartRow[];            // everyone, best score first, with when they play (from startRows())
  me: number;                  // your seat: that row gets the YOU tag
  round: number;
  target: number;
  paused?: boolean;            // a menu or dialog is open on top: the board stays until it is closed
  onDone: () => void;          // called once, when the board has been on screen long enough or has been tapped
};

type RowProps = { row: StartRow; index: number; isMe: boolean; height: number };

// One line of the board: who and their score. (When each one plays is on the avatars at the table, and a screen
// reader hears it here too.) Your own line has the gold edge and,
// at the normal text size, a YOU tag; with bigger text the tag would take the room a name needs (it is
// "Plucky B…" otherwise), so the gold edge alone says which line is yours (a screen reader is told as well).
function StartRowView({ row, index, isMe, height }: RowProps) {
  const { colors, reduceMotion, speed, scale } = useUi();
  const styles = useStyles(makeStyles);
  const arrived = useSharedValue(0);   // 0 = not there yet, 1 = in place

  useEffect(() => {
    const wait = reduceMotion ? 0 : paced(FIRST_ROW_MS + index * ROW_STAGGER_MS, speed);
    const take = paced(reduceMotion ? FADE_MS : ROW_MS, speed);
    arrived.value = withDelay(wait, withTiming(1, { duration: take, easing: Easing.out(Easing.cubic) }));
  }, []);

  const slide = useAnimatedStyle(() => ({
    opacity: arrived.value,
    transform: [{ translateX: reduceMotion ? 0 : (1 - arrived.value) * -24 }],
  }));

  return (
    <Animated.View
      style={[
        styles.row,
        { height, backgroundColor: isMe ? colors.surfaceRaised : colors.surface, borderColor: isMe ? colors.gold : colors.border },
        slide,
      ]}
    >
      <Avatar look={row.look} size={30} />
      <View style={styles.nameBox}>
        <T size={15} weight={800} lh={1} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexShrink: 1 }}>{row.name}</T>
        {isMe && scale <= 1 ? (
          <View style={styles.youTag}>
            <T size={10} weight={900} spacing={1} lh={1} color={colors.onGold}>YOU</T>
          </View>
        ) : null}
      </View>
      <View style={styles.scoreBox}>
        <T size={20} weight="display" lh={1} align="right">{row.score}</T>
      </View>
    </Animated.View>
  );
}

// The board at the start of every round: "ROUND 3", then everyone sorted by score (a tie is listed in playing
// order). It covers the whole screen, because the table underneath has not been
// dealt yet. The rows slide in one after another, the finished board stays a moment, then onDone is called.
// Tapping anywhere moves on at once. With a screen reader on it waits for a tap instead of moving on
// by itself, so there is time to hear the whole board.
export function RoundStart({ rows, me, round, target, paused = false, onDone }: Props) {
  const { colors, reduceMotion, speed, highContrast, scale } = useUi();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const latest = useRef(onDone);
  latest.current = onDone;
  const finished = useRef(false);
  const screenReader = useScreenReader();
  const [listHeight, setListHeight] = useState(0);
  const [headingsHeight, setHeadingsHeight] = useState(0);   // the PLAYER / SCORE line, as it is drawn

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    latest.current();
  }, []);

  // Move on by itself once the last row has landed and the board has been held for a while.
  // While a menu or dialog is open on top, the board waits, and the wait starts over when it is closed.
  useEffect(() => {
    if (screenReader || paused) return;
    const lastRowLands = reduceMotion ? FADE_MS : FIRST_ROW_MS + Math.max(0, rows.length - 1) * ROW_STAGGER_MS + ROW_MS;
    const timer = setTimeout(finish, paced(lastRowLands + HOLD_MS, speed));
    return () => clearTimeout(timer);
  }, [screenReader, paused]);

  // Rows are 48 tall, and shrink (down to 38) when eight of them would not fit on a short phone.
  // If they still do not fit, the list scrolls. (The headings take what they take: until they have been
  // measured, a guess does.)
  const labelsHeight = headingsHeight > 0 ? headingsHeight : Math.ceil(11 * scale * 1.3) + 8;
  const room = listHeight - labelsHeight - ROW_GAP * (rows.length - 1);
  const rowHeight = listHeight > 0 && rows.length > 0 ? Math.max(MIN_ROW, Math.min(MAX_ROW, Math.floor(room / rows.length))) : MAX_ROW;
  const titleSize = screenHeight < 700 ? 52 : 68;
  // Only when the rows would not fit even at their smallest does the list scroll; otherwise a tap on it
  // goes straight through to the "tap anywhere to continue" button behind.
  const needsScroll = listHeight > 0 && rows.length * rowHeight + ROW_GAP * (rows.length - 1) > listHeight - labelsHeight + 1;

  const spoken = rows.map((r) => `${r.seat === me ? "You" : r.name}, ${pointsText(r.score)}, plays ${ordinal(r.plays)}`).join(". ");

  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <Backdrop />
      {highContrast ? null : <View pointerEvents="none" style={styles.veil} />}
      <Tap
        onPress={finish}
        haptic={null}
        label={`Next up: round ${round}. First to ${target} wins. ${spoken}.`}
        hint={screenReader ? "Double tap to start the round" : "Tap to skip"}
        style={[styles.tap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.titleBlock}>
          <T size={14} weight={900} spacing={3} lh={1} color={colors.textFaint}>NEXT UP</T>
          <Animated.View entering={reduceMotion ? undefined : ZoomIn.springify().damping(14)} style={{ alignSelf: "stretch" }}>
            <StampedTitle size={titleSize} depth={5} spacing={3}>{`ROUND ${round}`}</StampedTitle>
          </Animated.View>
          <T size={15} weight={800} lh={1}>{`First to ${target} wins`}</T>
        </View>

        <View style={styles.listArea} onLayout={(e: LayoutChangeEvent) => setListHeight(e.nativeEvent.layout.height)}>
          <View style={styles.labels} onLayout={(e: LayoutChangeEvent) => setHeadingsHeight(e.nativeEvent.layout.height)}>
            <View style={{ flex: 1 }}>
              <T size={11} weight={900} spacing={1.5} lh={1} color={colors.textFaint}>PLAYER</T>
            </View>
            <View style={{ width: scoreColumn(scale) }}>
              <T size={11} weight={900} spacing={1.5} lh={1} color={colors.textFaint} align="right">SCORE</T>
            </View>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: ROW_GAP }}
            scrollEnabled={needsScroll}
            pointerEvents={needsScroll ? "auto" : "none"}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            {rows.map((row, i) => (
              <StartRowView key={row.seat} row={row} index={i} isMe={row.seat === me} height={rowHeight} />
            ))}
          </ScrollView>
        </View>
      </Tap>
    </View>
  );
}
