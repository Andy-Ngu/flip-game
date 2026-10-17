import { memo, ReactNode } from "react";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { describeTile, STATUS_LABEL, tileStatus, TileStatus } from "../../game/describe";
import { duplicateIndex, ordinal } from "../../game/results";
import { scoreHand } from "../../game/scoring";
import { MINI_GAP } from "../../game/tableMetrics";
import { TableMetrics } from "../../game/tableMetrics";
import { Player } from "../../game/types";
import { Palette } from "../theme";
import { useStyles, useUi } from "../AppContext";
import { Avatar } from "../avatars/Avatar";
import { MiniCard } from "../cards/MiniCard";
import { hexAlpha } from "../overlays/glow";
import { Icon } from "../ui/Icon";
import { T } from "../ui/T";
import { Tap } from "../ui/Tap";
import { makeStyles, TILE_RADIUS } from "./OpponentTile.styles";
import { OrderBadge, PickGlow, PickTag } from "./PickMarks";

type Props = {
  player: Player;
  target: number;
  metrics: TableMetrics;
  acting: boolean;       // it is their turn, or they have to pick a player
  crown?: boolean;       // they are winning right now
  near?: boolean;        // close to the target score
  dealt: boolean;        // false while the round is being set up: the tile shows no cards
  pick?: "can" | "no" | null; // choosing a player: "can" = gold outline, PICK tag and tappable; "no" = greyed out; null = as usual
  onPick?: () => void;   // tapping a tile marked "can"
  bubble?: ReactNode;    // a chat bubble or emote from them: it sits beside their name and never covers the cards
  badge?: number | null; // the order the round is played in (1 plays first), shown while the round starts
};

const statusColor = (s: TileStatus, c: Palette): string =>
  ({ turn: c.gold, waiting: c.textFaint, stayed: c.textFaint, bust: c.danger, out: c.blue })[s];

// One opponent: who they are, where they stand, and the real cards they are holding.
export const OpponentTile = memo(function OpponentTile({ player, target, metrics, acting, crown, near, dealt, pick, onPick, bubble, badge }: Props) {
  const { colors, reduceMotion, reduceFlashes } = useUi();
  const styles = useStyles(makeStyles);
  const status = tileStatus(player, acting);
  const points = scoreHand(player);
  const dupAt = player.status === "busted" ? duplicateIndex(player.hand) : null;
  const faded = player.status === "busted" || player.status === "timedOut";

  // The seven slots; a hand with more than seven cards overlaps them so they all fit.
  const inner = metrics.tileW - 2 * colors.borderWidth - 12;
  const count = player.hand.length;
  const step = count <= 7 ? metrics.miniW + MINI_GAP : (inner - metrics.miniW) / (count - 1);

  // Choosing a player: the ones you can pick light up and can be tapped, the others are greyed out.
  const canPick = pick === "can";
  const tappable = canPick && onPick !== undefined;
  const hasBubble = !!bubble;

  const pointsColor = status === "bust" ? colors.danger : status === "stayed" ? colors.textFaint : colors.gold;
  const lit = acting || canPick;
  const borderColor = lit ? colors.gold : near ? colors.goldDark : hasBubble ? colors.text : colors.border;
  // The tile of whoever is acting glows; with Reduce flashes on it gets a thicker outline instead.
  // (A tile you can pick has its own, swelling glow.)
  const glow = acting && !canPick && !reduceFlashes ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 18, color: hexAlpha(colors.gold, 0.45) }] } : null;
  const borderWidth = lit && reduceFlashes ? colors.borderWidth + 1.5 : colors.borderWidth;
  const opacity = pick === "no" ? 0.42 : canPick ? 1 : faded ? 0.78 : 1;

  // What a screen reader says for the whole tile.
  const spoken = `${describeTile(player, acting)}${badge ? ` Plays ${ordinal(badge)}.` : ""}`;
  const label = pick === "no" ? `${spoken} Cannot be picked.` : spoken;

  return (
    // The frame is the size of the tile. The marks that hang over its edge (the badge, the PICK tag, the
    // bubble) sit in the frame and not in the tile, so fading the tile never fades them.
    <View>
      <View
        accessible={!tappable}
        accessibilityLabel={tappable ? undefined : label}
        style={[styles.tile, { height: metrics.tileH, borderColor, borderWidth, opacity }, glow]}
      >
        {/* When the tile is a button its own label says everything, so the pieces inside are skipped. */}
        <View accessibilityElementsHidden={tappable} importantForAccessibility={tappable ? "no-hide-descendants" : "auto"}>
          <View style={[styles.header, { height: metrics.headerH }]}>
            <View>
              <Avatar look={player.look} size={metrics.avatar} ring={{ progress: target > 0 ? player.totalScore / target : 0, color: colors.gold, track: colors.border }} />
              {crown ? (
                <View style={badge ? styles.crownRight : styles.crown}>
                  <Icon name="crown" size={14} color={colors.gold} />
                </View>
              ) : null}
            </View>
            <View style={styles.names}>
              <T size={13} weight={800} lh={1.05} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{player.name}</T>
              <T size={10.5} weight={900} lh={1.05} color={statusColor(status, colors)} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{STATUS_LABEL[status]}</T>
            </View>
            <View style={styles.scores}>
              <T size={18} weight="display" lh={1}>{player.totalScore}</T>
              <T size={11.5} weight={900} lh={1.05} color={pointsColor}>{`+${points}`}</T>
            </View>
          </View>

          <View style={[styles.cards, { height: metrics.miniH }]}>
            {Array.from({ length: Math.max(0, 7 - count) }, (_, k) => (
              <View key={`slot${k}`} style={{ position: "absolute", left: (count + k) * (metrics.miniW + MINI_GAP), top: 0 }}>
                <MiniCard width={metrics.miniW} />
              </View>
            ))}
            {dealt
              ? player.hand.map((card, i) => (
                  <Animated.View
                    key={i}
                    entering={reduceMotion ? undefined : ZoomIn.duration(170)}
                    style={{ position: "absolute", left: i * step, top: 0, zIndex: i }}
                  >
                    <MiniCard card={card} width={metrics.miniW} duplicate={dupAt === i} />
                  </Animated.View>
                ))
              : null}
          </View>
        </View>
      </View>

      {canPick ? <PickGlow radius={TILE_RADIUS} /> : null}

      {tappable ? <Tap onPress={onPick} label={spoken} hint={`Picks ${player.name}`} style={(pressed) => [styles.press, pressed ? styles.pressed : null]} /> : null}

      {badge ? <OrderBadge n={badge} style={styles.badge} /> : null}

      {canPick ? <PickTag style={styles.tag} /> : null}

      {hasBubble ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: colors.borderWidth + 6 + metrics.avatar + 7,   // where their name starts
            right: 4,
            top: colors.borderWidth + 4,
            height: metrics.headerH,
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {bubble}
        </View>
      ) : null}
    </View>
  );
});
