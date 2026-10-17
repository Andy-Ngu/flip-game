import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, FadeInDown, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { paced } from "../../game/pace";
import { ordinal, Row } from "../../game/results";
import { pointsText } from "../../game/words";
import { useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { FillBar } from "../ui/FillBar";
import { T } from "../ui/T";
import { CountUp } from "./CountUp";
import { Crown } from "./Crown";
import { Tag } from "./Tag";

type Props = {
  row: Row;
  index: number;      // 0 for the first line: decides how soon it slides in
  target: number;     // the score that wins the game
  isMe: boolean;
  crown: boolean;     // the one clear leader
  showBot: boolean;   // say which players are computers (only worth it when other people play too)
  dense: boolean;     // the rows would not all fit at full size: everything a little smaller so more fits on the screen
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// A small gold square with a 7 on the corner of the avatar of anyone who made a Seven Stack this round.
function SevenBadge() {
  const { colors } = useUi();
  return (
    <View
      style={{
        position: "absolute", right: -5, bottom: -4, width: 20, height: 20, borderRadius: 6,
        backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.bg, alignItems: "center", justifyContent: "center",
      }}
    >
      <T fixed size={12} weight="display" lh={1} color={colors.onGold}>7</T>
    </View>
  );
}

// One player's line on the round results: where they stand, what happened to them this round,
// the points they earned, their new total, and how far that total is along the way to the target.
export const ResultRow = memo(function ResultRow({ row, index, target, isMe, crown, showBot, dense }: Props) {
  const { colors, reduceMotion, speed, scale } = useUi();
  const animate = !reduceMotion;

  // The lines slide in one after another; once a line is in, its total counts up and its bar fills.
  // (Slower than it was: the totals went by too fast to see which way they were moving.)
  const enterAt = paced(index * 80, speed);
  const countAt = enterAt + paced(500, speed);
  const countFor = paced(1300, speed);

  const statusColor = row.sevenStack ? colors.gold : row.status === "busted" ? colors.danger : row.status === "timedOut" ? colors.blue : colors.textFaint;
  const pointsColor = row.status === "busted" ? colors.danger : colors.gold;
  const avatarSize = dense ? 34 : 42;

  // The bar starts where the player was before this round and fills up to where they are now.
  const from = clamp01(row.before / target);
  const to = clamp01(row.total / target);
  const fill = useSharedValue(animate ? from : to);
  useEffect(() => {
    if (!animate) {
      fill.value = to;
      return;
    }
    fill.value = from;
    fill.value = withDelay(countAt, withTiming(to, { duration: countFor, easing: Easing.out(Easing.quad) }));
  }, [from, to, animate, countAt, countFor]);

  const label =
    `${ordinal(row.rank)}${crown ? ", in the lead" : ""}. ${row.name}${isMe ? ", you" : ""}. ${row.line}. ` +
    `${pointsText(row.roundPoints)} this round. Total ${row.total} of ${target}.`;

  return (
    <Animated.View
      entering={animate ? FadeInDown.delay(enterAt).duration(paced(280, speed)) : undefined}
      accessible
      accessibilityLabel={label}
      style={{
        borderRadius: 16,
        borderWidth: colors.borderWidth,
        borderColor: isMe ? colors.gold : colors.border,
        backgroundColor: isMe ? colors.surfaceRaised : colors.surface,
        paddingVertical: dense ? 8 : 10,
        paddingHorizontal: 12,
        gap: dense ? 6 : 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 22, alignItems: "center" }}>
          <T size={18} weight="display" lh={1} color={row.rank === 1 ? colors.gold : colors.textFaint}>{String(row.rank)}</T>
        </View>

        <View>
          <Avatar look={row.look} size={avatarSize} />
          {crown ? (
            <View style={{ position: "absolute", left: -6, top: -12 }}>
              <Crown width={24} rotate={-14} />
            </View>
          ) : null}
          {row.sevenStack ? <SevenBadge /> : null}
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <T size={dense ? 14 : 15} weight={800} lh={1.05} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexShrink: 1 }}>{row.name}</T>
            {isMe && scale <= 1 ? <Tag kind="you" text="YOU" /> : null}
            {showBot && row.bot ? <Tag kind="bot" text="BOT" /> : null}
          </View>
          <T size={12} weight={800} lh={1.2} color={statusColor}>{row.line}</T>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <T size={dense ? 22 : 26} weight="display" lh={1} color={pointsColor}>{`+${row.roundPoints}`}</T>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <T size={12} weight={800} lh={1} color={colors.textDim}>total</T>
            <CountUp from={row.before} to={row.total} delay={countAt} duration={countFor} animate={animate} size={18} weight="display" lh={1} color={colors.text} />
          </View>
        </View>
      </View>

      <FillBar progress={fill} color={colors.gold} track={colors.bg} height={dense ? 6 : 8} />
    </Animated.View>
  );
});
